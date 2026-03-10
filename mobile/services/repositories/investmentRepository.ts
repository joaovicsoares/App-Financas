import { getDB, enqueueSync } from '../database';

export interface LocalInvestment {
    id: string;
    userId: string;
    name: string;
    type: number;
    status: number;
    amountInvested: number;
    annualRate: number;
    startDate: string;
    maturityDate: string | null;
    redeemedAt: string | null;
    redeemedAmount: number | null;
    notes: string;
    createdAt: string;
    // Calculated (done in JS, not stored)
    currentValue?: number;
    totalYield?: number;
    yieldPercentage?: number;
}

export interface CreateInvestmentInput {
    id: string;
    userId: string;
    name: string;
    type: number;
    amountInvested: number;
    annualRate: number;
    startDate: string;
    maturityDate?: string | null;
    notes: string;
}

function calculateYields(inv: LocalInvestment): LocalInvestment {
    if (inv.status === 1) {
        // Redeemed
        const currentValue = inv.redeemedAmount ?? inv.amountInvested;
        const totalYield = currentValue - inv.amountInvested;
        return {
            ...inv,
            currentValue,
            totalYield,
            yieldPercentage: inv.amountInvested > 0 ? Math.round((totalYield / inv.amountInvested) * 10000) / 100 : 0,
        };
    }

    const days = (Date.now() - new Date(inv.startDate).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 0) {
        return { ...inv, currentValue: inv.amountInvested, totalYield: 0, yieldPercentage: 0 };
    }

    // V = P × (1 + r)^(d/365)
    const currentValue = Math.round(inv.amountInvested * Math.pow(1 + inv.annualRate, days / 365) * 100) / 100;
    const totalYield = Math.round((currentValue - inv.amountInvested) * 100) / 100;
    const yieldPercentage = inv.amountInvested > 0 ? Math.round((totalYield / inv.amountInvested) * 10000) / 100 : 0;

    return { ...inv, currentValue, totalYield, yieldPercentage };
}

export const InvestmentRepository = {
    getAll(userId: string): LocalInvestment[] {
        const db = getDB();
        const rows = db.getAllSync<LocalInvestment>(
            'SELECT * FROM investments WHERE userId = ? AND deleted = 0 ORDER BY createdAt DESC',
            [userId]
        );
        return rows.map(calculateYields);
    },

    getActive(userId: string): LocalInvestment[] {
        const db = getDB();
        const rows = db.getAllSync<LocalInvestment>(
            'SELECT * FROM investments WHERE userId = ? AND status = 0 AND deleted = 0 ORDER BY createdAt DESC',
            [userId]
        );
        return rows.map(calculateYields);
    },

    getById(id: string): LocalInvestment | null {
        const db = getDB();
        const row = db.getFirstSync<LocalInvestment>(
            'SELECT * FROM investments WHERE id = ? AND deleted = 0',
            [id]
        );
        return row ? calculateYields(row) : null;
    },

    getSummary(userId: string): { totalInvested: number; totalCurrentValue: number; totalYield: number; yieldPercentage: number; activeCount: number } {
        const active = this.getActive(userId);
        const totalInvested = active.reduce((s, i) => s + i.amountInvested, 0);
        const totalCurrentValue = active.reduce((s, i) => s + (i.currentValue ?? i.amountInvested), 0);
        const totalYield = totalCurrentValue - totalInvested;
        return {
            totalInvested,
            totalCurrentValue,
            totalYield,
            yieldPercentage: totalInvested > 0 ? Math.round((totalYield / totalInvested) * 10000) / 100 : 0,
            activeCount: active.length,
        };
    },

    create(input: CreateInvestmentInput) {
        const db = getDB();
        db.runSync(
            `INSERT INTO investments (id, userId, name, type, status, amountInvested, annualRate, startDate, maturityDate, notes, createdAt, synced, lastModified, deleted)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, datetime('now'), 0, datetime('now'), 0)`,
            [input.id, input.userId, input.name, input.type, input.amountInvested, input.annualRate, input.startDate, input.maturityDate ?? null, input.notes]
        );
        enqueueSync('CREATE', 'investments', input.id, input);
    },

    delete(id: string) {
        const db = getDB();
        db.runSync(
            "UPDATE investments SET deleted = 1, synced = 0, lastModified = datetime('now') WHERE id = ?",
            [id]
        );
        enqueueSync('DELETE', 'investments', id, null);
    },

    redeem(id: string, redeemedAmount: number) {
        const db = getDB();
        db.runSync(
            "UPDATE investments SET status = 1, redeemedAt = datetime('now'), redeemedAmount = ?, synced = 0, lastModified = datetime('now') WHERE id = ?",
            [redeemedAmount, id]
        );
        enqueueSync('UPDATE', 'investments', id, { status: 1, redeemedAmount });
    },

    /** Upsert from server sync */
    upsertFromServer(investment: LocalInvestment) {
        const db = getDB();
        db.runSync(
            `INSERT OR REPLACE INTO investments (id, userId, name, type, status, amountInvested, annualRate, startDate, maturityDate, redeemedAt, redeemedAmount, notes, createdAt, synced, lastModified, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), 0)`,
            [investment.id, investment.userId, investment.name, investment.type, investment.status, investment.amountInvested, investment.annualRate, investment.startDate, investment.maturityDate, investment.redeemedAt, investment.redeemedAmount, investment.notes, investment.createdAt]
        );
    },
};

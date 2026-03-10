import { getDB, enqueueSync } from '../database';

export interface LocalTransaction {
    id: string;
    userId: string;
    categoryId: string;
    sharedWalletId: string | null;
    amount: number;
    type: number;
    recurrenceType: number;
    totalInstallments: number | null;
    currentInstallment: number | null;
    recurrenceGroupId: string | null;
    description: string;
    date: string;
    createdAt: string;
    // Joined fields
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
}

export interface CreateTransactionInput {
    id: string;
    userId: string;
    categoryId: string;
    sharedWalletId?: string | null;
    amount: number;
    type: number;
    recurrenceType: number;
    totalInstallments?: number | null;
    currentInstallment?: number | null;
    recurrenceGroupId?: string | null;
    description: string;
    date: string;
}

export const TransactionRepository = {
    getByMonth(userId: string, year: number, month: number): LocalTransaction[] {
        const db = getDB();
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endMonth = month === 12 ? 1 : month + 1;
        const endYear = month === 12 ? year + 1 : year;
        const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

        return db.getAllSync<LocalTransaction>(
            `SELECT t.*, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor
             FROM transactions t
             LEFT JOIN categories c ON t.categoryId = c.id
             WHERE t.userId = ? AND t.date >= ? AND t.date < ? AND t.deleted = 0
             ORDER BY t.date DESC`,
            [userId, startDate, endDate]
        );
    },

    getRecent(userId: string, limit: number = 10): LocalTransaction[] {
        const db = getDB();
        const now = new Date();
        const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const endMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
        const endYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear();
        const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

        return db.getAllSync<LocalTransaction>(
            `SELECT t.*, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor
             FROM transactions t
             LEFT JOIN categories c ON t.categoryId = c.id
             WHERE t.userId = ? AND t.date >= ? AND t.date < ? AND t.deleted = 0
             ORDER BY t.date DESC
             LIMIT ?`,
            [userId, startDate, endDate, limit]
        );
    },

    getMonthTotals(userId: string, year: number, month: number): { totalIncome: number; totalExpenses: number } {
        const db = getDB();
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endMonth = month === 12 ? 1 : month + 1;
        const endYear = month === 12 ? year + 1 : year;
        const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

        const income = db.getFirstSync<{ total: number }>(
            `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
             WHERE userId = ? AND type = 0 AND date >= ? AND date < ? AND deleted = 0`,
            [userId, startDate, endDate]
        );

        const expenses = db.getFirstSync<{ total: number }>(
            `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
             WHERE userId = ? AND type = 1 AND date >= ? AND date < ? AND deleted = 0`,
            [userId, startDate, endDate]
        );

        return {
            totalIncome: income?.total ?? 0,
            totalExpenses: expenses?.total ?? 0,
        };
    },

    create(input: CreateTransactionInput) {
        const db = getDB();
        db.runSync(
            `INSERT INTO transactions (id, userId, categoryId, sharedWalletId, amount, type, recurrenceType, totalInstallments, currentInstallment, recurrenceGroupId, description, date, createdAt, synced, lastModified, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0, datetime('now'), 0)`,
            [input.id, input.userId, input.categoryId, input.sharedWalletId ?? null, input.amount, input.type, input.recurrenceType, input.totalInstallments ?? null, input.currentInstallment ?? null, input.recurrenceGroupId ?? null, input.description, input.date]
        );
        enqueueSync('CREATE', 'transactions', input.id, input);
    },

    delete(id: string) {
        const db = getDB();
        db.runSync(
            "UPDATE transactions SET deleted = 1, synced = 0, lastModified = datetime('now') WHERE id = ?",
            [id]
        );
        enqueueSync('DELETE', 'transactions', id, null);
    },

    /** Upsert from server sync */
    upsertFromServer(transaction: LocalTransaction) {
        const db = getDB();
        db.runSync(
            `INSERT OR REPLACE INTO transactions (id, userId, categoryId, sharedWalletId, amount, type, recurrenceType, totalInstallments, currentInstallment, recurrenceGroupId, description, date, createdAt, synced, lastModified, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), 0)`,
            [transaction.id, transaction.userId, transaction.categoryId, transaction.sharedWalletId, transaction.amount, transaction.type, transaction.recurrenceType, transaction.totalInstallments, transaction.currentInstallment, transaction.recurrenceGroupId, transaction.description, transaction.date, transaction.createdAt]
        );
    },
};

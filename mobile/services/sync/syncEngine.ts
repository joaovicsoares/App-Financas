import api from '../api';
import { getDB, enqueueSync, getSyncMeta, setSyncMeta } from '../database';
import { CategoryRepository } from '../repositories/categoryRepository';
import { TransactionRepository } from '../repositories/transactionRepository';
import { InvestmentRepository } from '../repositories/investmentRepository';
import NetInfo from '@react-native-community/netinfo';

let isSyncing = false;
let syncListeners: Array<(status: SyncStatus) => void> = [];

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

export function onSyncStatusChange(listener: (status: SyncStatus) => void) {
    syncListeners.push(listener);
    return () => {
        syncListeners = syncListeners.filter(l => l !== listener);
    };
}

function notifyListeners(status: SyncStatus) {
    syncListeners.forEach(l => l(status));
}

/** Push local changes to server */
async function pushChanges(): Promise<boolean> {
    const db = getDB();
    const pending = db.getAllSync<{
        id: number;
        operation: string;
        entity: string;
        entityId: string;
        payload: string | null;
    }>('SELECT * FROM sync_queue WHERE processed = 0 ORDER BY createdAt ASC');

    if (pending.length === 0) return true;

    for (const op of pending) {
        try {
            const payload = op.payload ? JSON.parse(op.payload) : null;

            if (op.operation === 'CREATE') {
                await api.post(`/${op.entity}`, payload);
            } else if (op.operation === 'UPDATE') {
                await api.put(`/${op.entity}/${op.entityId}`, payload);
            } else if (op.operation === 'DELETE') {
                await api.delete(`/${op.entity}/${op.entityId}`);
            }

            // Mark as processed
            db.runSync('UPDATE sync_queue SET processed = 1 WHERE id = ?', [op.id]);
            // Mark entity as synced
            db.runSync(`UPDATE ${op.entity} SET synced = 1 WHERE id = ?`, [op.entityId]);
        } catch (error: any) {
            console.error(`Sync push failed for ${op.entity}/${op.entityId}:`, error?.message);
            // If server returns 404 on delete, mark as processed anyway
            if (op.operation === 'DELETE' && error?.response?.status === 404) {
                db.runSync('UPDATE sync_queue SET processed = 1 WHERE id = ?', [op.id]);
                db.runSync(`DELETE FROM ${op.entity} WHERE id = ?`, [op.entityId]);
            }
            return false;
        }
    }

    // Clean up processed queue entries
    db.runSync('DELETE FROM sync_queue WHERE processed = 1');
    return true;
}

/** Pull server changes to local DB */
async function pullChanges(userId: string): Promise<boolean> {
    try {
        // Pull categories
        const categoriesRes = await api.get('/categories');
        for (const c of categoriesRes.data) {
            CategoryRepository.upsert({
                id: c.id,
                userId: c.userId ?? userId,
                name: c.name,
                icon: c.icon,
                color: c.color,
                type: c.type,
                isDefault: c.isDefault ? 1 : 0,
            }, true);
        }

        // Pull transactions (current month)
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const transactionsRes = await api.get('/transactions', { params: { startDate, endDate } });
        for (const t of transactionsRes.data) {
            t.userId = t.userId ?? userId;
            TransactionRepository.upsertFromServer(t);
        }

        // Pull investments
        const investmentsRes = await api.get('/investments');
        for (const inv of investmentsRes.data) {
            InvestmentRepository.upsertFromServer({
                id: inv.id,
                userId: inv.userId ?? userId,
                name: inv.name,
                type: inv.type,
                status: inv.status,
                amountInvested: inv.amountInvested,
                annualRate: inv.annualRate,
                startDate: inv.startDate,
                maturityDate: inv.maturityDate,
                redeemedAt: inv.redeemedAt,
                redeemedAmount: inv.redeemedAmount,
                notes: inv.notes,
                createdAt: inv.createdAt,
            });
        }

        setSyncMeta('lastSync', new Date().toISOString());
        return true;
    } catch (error: any) {
        console.error('Sync pull failed:', error?.message);
        return false;
    }
}

/** Full sync: push then pull */
export async function syncNow(userId: string): Promise<boolean> {
    if (isSyncing) return false;

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
        notifyListeners('offline');
        return false;
    }

    isSyncing = true;
    notifyListeners('syncing');

    try {
        const pushOk = await pushChanges();
        const pullOk = await pullChanges(userId);
        notifyListeners(pushOk && pullOk ? 'idle' : 'error');
        return pushOk && pullOk;
    } catch (error) {
        notifyListeners('error');
        return false;
    } finally {
        isSyncing = false;
    }
}

/** Start auto-sync on connectivity change */
export function startAutoSync(userId: string) {
    // Sync on app start
    syncNow(userId);

    // Sync when connection restored
    NetInfo.addEventListener(state => {
        if (state.isConnected) {
            syncNow(userId);
        } else {
            notifyListeners('offline');
        }
    });
}

/** Get pending sync count */
export function getPendingSyncCount(): number {
    const db = getDB();
    const row = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM sync_queue WHERE processed = 0'
    );
    return row?.count ?? 0;
}

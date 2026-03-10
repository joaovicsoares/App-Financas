import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDB(): SQLite.SQLiteDatabase {
    if (!db) {
        db = SQLite.openDatabaseSync('financas.db');
        initSchema();
    }
    return db;
}

function initSchema() {
    const database = db!;

    database.execSync(`
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            name TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT 'tag',
            color TEXT NOT NULL DEFAULT '#888',
            type INTEGER NOT NULL DEFAULT 1,
            isDefault INTEGER NOT NULL DEFAULT 0,
            synced INTEGER NOT NULL DEFAULT 0,
            lastModified TEXT NOT NULL DEFAULT (datetime('now')),
            deleted INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            categoryId TEXT NOT NULL,
            sharedWalletId TEXT,
            amount REAL NOT NULL,
            type INTEGER NOT NULL,
            recurrenceType INTEGER NOT NULL DEFAULT 0,
            totalInstallments INTEGER,
            currentInstallment INTEGER,
            recurrenceGroupId TEXT,
            description TEXT NOT NULL DEFAULT '',
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL DEFAULT (datetime('now')),
            synced INTEGER NOT NULL DEFAULT 0,
            lastModified TEXT NOT NULL DEFAULT (datetime('now')),
            deleted INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (categoryId) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS investments (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            name TEXT NOT NULL,
            type INTEGER NOT NULL DEFAULT 0,
            status INTEGER NOT NULL DEFAULT 0,
            amountInvested REAL NOT NULL,
            annualRate REAL NOT NULL,
            startDate TEXT NOT NULL,
            maturityDate TEXT,
            redeemedAt TEXT,
            redeemedAmount REAL,
            notes TEXT NOT NULL DEFAULT '',
            createdAt TEXT NOT NULL DEFAULT (datetime('now')),
            synced INTEGER NOT NULL DEFAULT 0,
            lastModified TEXT NOT NULL DEFAULT (datetime('now')),
            deleted INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS shared_wallets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            createdAt TEXT NOT NULL DEFAULT (datetime('now')),
            synced INTEGER NOT NULL DEFAULT 0,
            lastModified TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation TEXT NOT NULL,
            entity TEXT NOT NULL,
            entityId TEXT NOT NULL,
            payload TEXT,
            createdAt TEXT NOT NULL DEFAULT (datetime('now')),
            processed INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sync_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(userId, date);
        CREATE INDEX IF NOT EXISTS idx_transactions_group ON transactions(recurrenceGroupId);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(processed);
    `);
}

export function enqueueSync(operation: string, entity: string, entityId: string, payload: any) {
    const database = getDB();
    database.runSync(
        'INSERT INTO sync_queue (operation, entity, entityId, payload) VALUES (?, ?, ?, ?)',
        [operation, entity, entityId, payload ? JSON.stringify(payload) : null]
    );
}

export function getSyncMeta(key: string): string | null {
    const database = getDB();
    const row = database.getFirstSync<{ value: string }>(
        'SELECT value FROM sync_meta WHERE key = ?',
        [key]
    );
    return row?.value ?? null;
}

export function setSyncMeta(key: string, value: string) {
    const database = getDB();
    database.runSync(
        'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
        [key, value]
    );
}

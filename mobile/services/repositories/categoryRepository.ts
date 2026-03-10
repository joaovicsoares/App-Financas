import { getDB, enqueueSync } from '../database';

export interface LocalCategory {
    id: string;
    userId: string;
    name: string;
    icon: string;
    color: string;
    type: number;
    isDefault: number;
}

export const CategoryRepository = {
    getAll(userId: string): LocalCategory[] {
        const db = getDB();
        return db.getAllSync<LocalCategory>(
            'SELECT * FROM categories WHERE userId = ? AND deleted = 0 ORDER BY name',
            [userId]
        );
    },

    getByType(userId: string, type: number): LocalCategory[] {
        const db = getDB();
        return db.getAllSync<LocalCategory>(
            'SELECT * FROM categories WHERE userId = ? AND type = ? AND deleted = 0 ORDER BY name',
            [userId, type]
        );
    },

    getById(id: string): LocalCategory | null {
        const db = getDB();
        return db.getFirstSync<LocalCategory>(
            'SELECT * FROM categories WHERE id = ? AND deleted = 0',
            [id]
        ) ?? null;
    },

    upsert(category: LocalCategory, synced: boolean = false) {
        const db = getDB();
        db.runSync(
            `INSERT OR REPLACE INTO categories (id, userId, name, icon, color, type, isDefault, synced, lastModified, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)`,
            [category.id, category.userId, category.name, category.icon, category.color, category.type, category.isDefault, synced ? 1 : 0]
        );
    },

    /** Bulk upsert from server sync — marks all as synced */
    upsertFromServer(categories: LocalCategory[]) {
        const db = getDB();
        for (const c of categories) {
            this.upsert(c, true);
        }
    },
};

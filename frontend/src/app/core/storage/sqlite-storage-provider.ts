import { StorageProvider } from './storage-provider.interface';

/**
 * SQLite-backed storage provider for Tauri desktop builds.
 *
 * This provider implements the same StorageProvider interface as the
 * IndexedDB provider, allowing seamless swapping at the DI level
 * without changing any repository or service code.
 *
 * Requires: @tauri-apps/plugin-sql (installed in the Tauri project)
 *
 * Usage: In app.config.ts, swap the provider:
 *   { provide: STORAGE_PROVIDER, useClass: SqliteStorageProvider }
 */
export class SqliteStorageProvider implements StorageProvider {
  private db: any = null;

  async initialize(): Promise<void> {
    // Dynamic import to avoid bundling Tauri APIs in web builds
    const { default: Database } = await import('@tauri-apps/plugin-sql');
    this.db = await Database.load('sqlite:folio-library.db');
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    const tables = [
      'books', 'authors', 'collections', 'tags',
      'reading_progress', 'bookmarks', 'highlights', 'notes',
      'sync_queue', 'sync_metadata', 'settings', 'book_files',
    ];
    for (const table of tables) {
      await this.db.execute(
        `CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data TEXT NOT NULL)`
      );
    }
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const rows = await this.db.select<Array<{ data: string }>>(
      `SELECT data FROM ${storeName} WHERE id = ?`, [key]
    );
    return rows.length > 0 ? JSON.parse(rows[0].data) : undefined;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const rows = await this.db.select<Array<{ data: string }>>(
      `SELECT data FROM ${storeName}`
    );
    return rows.map((row: { data: string }) => JSON.parse(row.data));
  }

  async put<T>(storeName: string, key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    await this.db.execute(
      `INSERT OR REPLACE INTO ${storeName} (id, data) VALUES (?, ?)`,
      [key, json]
    );
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.db.execute(
      `DELETE FROM ${storeName} WHERE id = ?`, [key]
    );
  }

  async clear(storeName: string): Promise<void> {
    await this.db.execute(`DELETE FROM ${storeName}`);
  }

  async count(storeName: string): Promise<number> {
    const rows = await this.db.select<Array<{ cnt: number }>>(
      `SELECT COUNT(*) as cnt FROM ${storeName}`
    );
    return rows[0]?.cnt ?? 0;
  }

  async getAllKeys(storeName: string): Promise<string[]> {
    const rows = await this.db.select<Array<{ id: string }>>(
      `SELECT id FROM ${storeName}`
    );
    return rows.map((r: { id: string }) => r.id);
  }

  async putBulk<T>(storeName: string, items: Array<{ key: string; value: T }>): Promise<void> {
    for (const item of items) {
      await this.put(storeName, item.key, item.value);
    }
  }
}

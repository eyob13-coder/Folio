import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { StorageProvider } from './storage-provider.interface';

const DB_NAME = 'offline_digital_library_db';
const DB_VERSION = 1;

export const STORES = {
  BOOKS: 'books',
  AUTHORS: 'authors',
  BOOK_FILES: 'book_files',
  READING_PROGRESS: 'reading_progress',
  BOOKMARKS: 'bookmarks',
  HIGHLIGHTS: 'highlights',
  NOTES: 'notes',
  COLLECTIONS: 'collections',
  TAGS: 'tags',
  SETTINGS: 'settings',
  SYNC_QUEUE: 'sync_queue',
  SYNC_METADATA: 'sync_metadata',
  DOCUMENT_CHUNKS: 'document_chunks'
} as const;

@Injectable({
  providedIn: 'root'
})
export class IndexedDbStorageProvider implements StorageProvider {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Books store
          if (!db.objectStoreNames.contains(STORES.BOOKS)) {
            const bookStore = db.createObjectStore(STORES.BOOKS, { keyPath: 'id' });
            bookStore.createIndex('by_contentHash', 'contentHash', { unique: true });
            bookStore.createIndex('by_status', 'status');
            bookStore.createIndex('by_isFavorite', 'isFavorite');
            bookStore.createIndex('by_updatedAt', 'updatedAt');
          }

          // Book files binary store
          if (!db.objectStoreNames.contains(STORES.BOOK_FILES)) {
            db.createObjectStore(STORES.BOOK_FILES);
          }

          // Authors store
          if (!db.objectStoreNames.contains(STORES.AUTHORS)) {
            db.createObjectStore(STORES.AUTHORS, { keyPath: 'id' });
          }

          // Reading Progress store
          if (!db.objectStoreNames.contains(STORES.READING_PROGRESS)) {
            const progressStore = db.createObjectStore(STORES.READING_PROGRESS, { keyPath: 'id' });
            progressStore.createIndex('by_bookId', 'bookId', { unique: true });
          }

          // Bookmarks store
          if (!db.objectStoreNames.contains(STORES.BOOKMARKS)) {
            const bookmarkStore = db.createObjectStore(STORES.BOOKMARKS, { keyPath: 'id' });
            bookmarkStore.createIndex('by_bookId', 'bookId');
          }

          // Highlights store
          if (!db.objectStoreNames.contains(STORES.HIGHLIGHTS)) {
            const highlightStore = db.createObjectStore(STORES.HIGHLIGHTS, { keyPath: 'id' });
            highlightStore.createIndex('by_bookId', 'bookId');
          }

          // Notes store
          if (!db.objectStoreNames.contains(STORES.NOTES)) {
            const noteStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
            noteStore.createIndex('by_bookId', 'bookId');
            noteStore.createIndex('by_highlightId', 'highlightId');
          }

          // Collections store
          if (!db.objectStoreNames.contains(STORES.COLLECTIONS)) {
            db.createObjectStore(STORES.COLLECTIONS, { keyPath: 'id' });
          }

          // Tags store
          if (!db.objectStoreNames.contains(STORES.TAGS)) {
            db.createObjectStore(STORES.TAGS, { keyPath: 'id' });
          }

          // Settings store
          if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
            db.createObjectStore(STORES.SETTINGS);
          }

          // Sync Queue
          if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
            syncStore.createIndex('by_status', 'status');
            syncStore.createIndex('by_timestamp', 'timestamp');
          }

          // Sync Metadata
          if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
            db.createObjectStore(STORES.SYNC_METADATA);
          }

          // Document Chunks (for local RAG / full text)
          if (!db.objectStoreNames.contains(STORES.DOCUMENT_CHUNKS)) {
            const chunkStore = db.createObjectStore(STORES.DOCUMENT_CHUNKS, { keyPath: 'id' });
            chunkStore.createIndex('by_bookId', 'bookId');
          }
        }
      });
    })();

    return this.initPromise;
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.getDB();
    const result = await db.get(storeName, id);
    return (result as T) ?? null;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    const result = await db.getAll(storeName);
    return result as T[];
  }

  async getAllByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    const db = await this.getDB();
    const tx = db.transaction(storeName, 'readonly');
    const index = tx.store.index(indexName);
    const result = await index.getAll(value);
    await tx.done;
    return result as T[];
  }

  async set<T>(storeName: string, id: string, item: T): Promise<void> {
    const db = await this.getDB();
    // If store has keyPath, put directly, else specify key
    if (storeName === STORES.SETTINGS || storeName === STORES.SYNC_METADATA) {
      await db.put(storeName, item, id);
    } else {
      await db.put(storeName, item);
    }
  }

  async update<T>(storeName: string, id: string, partial: Partial<T>): Promise<T> {
    const db = await this.getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const existing = await tx.store.get(id);
    if (!existing) {
      throw new Error(`Item with id ${id} not found in ${storeName}`);
    }
    const updated = { ...existing, ...partial, updatedAt: new Date().toISOString() };
    await tx.store.put(updated);
    await tx.done;
    return updated as T;
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(storeName, id);
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    await db.clear(storeName);
  }

  async saveBlob(id: string, data: ArrayBuffer | Blob): Promise<void> {
    const db = await this.getDB();
    await db.put(STORES.BOOK_FILES, data, id);
  }

  async getBlob(id: string): Promise<ArrayBuffer | Blob | null> {
    const db = await this.getDB();
    const blob = await db.get(STORES.BOOK_FILES, id);
    return (blob as ArrayBuffer | Blob) ?? null;
  }

  async deleteBlob(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(STORES.BOOK_FILES, id);
  }

  async getStorageEstimate(): Promise<{ usageBytes: number; quotaBytes: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usageBytes: estimate.usage || 0,
        quotaBytes: estimate.quota || 0
      };
    }
    return { usageBytes: 0, quotaBytes: 0 };
  }
}

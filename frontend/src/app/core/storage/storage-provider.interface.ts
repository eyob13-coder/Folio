import { InjectionToken } from '@angular/core';

export const STORAGE_PROVIDER = new InjectionToken<StorageProvider>('STORAGE_PROVIDER');

export interface StorageProvider {
  initialize(): Promise<void>;
  
  // Generic CRUD
  get<T>(storeName: string, id: string): Promise<T | null>;
  getAll<T>(storeName: string): Promise<T[]>;
  getAllByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]>;
  set<T>(storeName: string, id: string, item: T): Promise<void>;
  update<T>(storeName: string, id: string, partial: Partial<T>): Promise<T>;
  delete(storeName: string, id: string): Promise<void>;
  clear(storeName: string): Promise<void>;
  
  // Binary / Blob storage for books
  saveBlob(id: string, data: ArrayBuffer | Blob): Promise<void>;
  getBlob(id: string): Promise<ArrayBuffer | Blob | null>;
  deleteBlob(id: string): Promise<void>;
  
  // Storage Stats
  getStorageEstimate(): Promise<{ usageBytes: number; quotaBytes: number }>;
}

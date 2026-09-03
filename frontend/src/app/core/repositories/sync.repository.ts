import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../storage/storage-provider.interface';
import { STORES } from '../storage/indexeddb-storage-provider';
import { SyncQueueItem, SyncMetadata } from '../models/sync.model';

const SYNC_META_KEY = 'sync_meta';

@Injectable({
  providedIn: 'root'
})
export class SyncRepository {
  private storage = inject(STORAGE_PROVIDER);

  async getPendingQueue(): Promise<SyncQueueItem[]> {
    const list = await this.storage.getAllByIndex<SyncQueueItem>(STORES.SYNC_QUEUE, 'by_status', 'pending');
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getAllQueueItems(): Promise<SyncQueueItem[]> {
    const list = await this.storage.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async enqueue(item: SyncQueueItem): Promise<void> {
    await this.storage.set<SyncQueueItem>(STORES.SYNC_QUEUE, item.id, item);
  }

  async updateQueueItem(item: SyncQueueItem): Promise<void> {
    await this.storage.set<SyncQueueItem>(STORES.SYNC_QUEUE, item.id, item);
  }

  async deleteQueueItem(id: string): Promise<void> {
    await this.storage.delete(STORES.SYNC_QUEUE, id);
  }

  async clearQueue(): Promise<void> {
    await this.storage.clear(STORES.SYNC_QUEUE);
  }

  async getMetadata(): Promise<SyncMetadata> {
    const meta = await this.storage.get<SyncMetadata>(STORES.SYNC_METADATA, SYNC_META_KEY);
    return meta ?? {
      lastSyncTimestamp: null,
      deviceId: 'device-' + Math.random().toString(36).substring(2, 9),
      autoSync: false
    };
  }

  async saveMetadata(metadata: SyncMetadata): Promise<void> {
    await this.storage.set<SyncMetadata>(STORES.SYNC_METADATA, SYNC_META_KEY, metadata);
  }
}

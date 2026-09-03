import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../storage/storage-provider.interface';
import { STORES } from '../storage/indexeddb-storage-provider';
import { Collection, Tag } from '../models/collection.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionRepository {
  private storage = inject(STORAGE_PROVIDER);

  // Collections
  async getAllCollections(): Promise<Collection[]> {
    const list = await this.storage.getAll<Collection>(STORES.COLLECTIONS);
    return list.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    return this.storage.get<Collection>(STORES.COLLECTIONS, id);
  }

  async saveCollection(collection: Collection): Promise<Collection> {
    await this.storage.set<Collection>(STORES.COLLECTIONS, collection.id, collection);
    return collection;
  }

  async updateCollection(id: string, partial: Partial<Collection>): Promise<Collection> {
    return this.storage.update<Collection>(STORES.COLLECTIONS, id, partial);
  }

  async deleteCollection(id: string): Promise<void> {
    await this.storage.delete(STORES.COLLECTIONS, id);
  }

  // Tags
  async getAllTags(): Promise<Tag[]> {
    return this.storage.getAll<Tag>(STORES.TAGS);
  }

  async saveTag(tag: Tag): Promise<Tag> {
    await this.storage.set<Tag>(STORES.TAGS, tag.id, tag);
    return tag;
  }

  async deleteTag(id: string): Promise<void> {
    await this.storage.delete(STORES.TAGS, id);
  }
}

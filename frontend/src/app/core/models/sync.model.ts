export type SyncActionType =
  | 'CREATE_BOOK'
  | 'UPDATE_BOOK'
  | 'DELETE_BOOK'
  | 'UPDATE_PROGRESS'
  | 'CREATE_BOOKMARK'
  | 'DELETE_BOOKMARK'
  | 'CREATE_HIGHLIGHT'
  | 'DELETE_HIGHLIGHT'
  | 'CREATE_NOTE'
  | 'UPDATE_NOTE'
  | 'DELETE_NOTE'
  | 'CREATE_COLLECTION'
  | 'UPDATE_COLLECTION'
  | 'DELETE_COLLECTION';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'success';

export interface SyncQueueItem {
  id: string; // client-generated UUID / Idempotency Key
  action: SyncActionType;
  entityType: string;
  entityId: string;
  payload: any;
  retryCount: number;
  lastError?: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'failed' | 'synced';
}

export interface SyncConflict<T = any> {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: T;
  remoteVersion: T;
  localTimestamp: string;
  remoteTimestamp: string;
  resolved: boolean;
  resolutionStrategy?: 'keep_local' | 'keep_remote' | 'merge';
}

export interface SyncMetadata {
  lastSyncTimestamp: string | null;
  deviceId: string;
  serverUrl?: string;
  authToken?: string;
  autoSync: boolean;
}

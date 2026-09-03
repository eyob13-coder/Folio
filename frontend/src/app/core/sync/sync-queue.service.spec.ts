import { TestBed } from '@angular/core/testing';
import { SyncQueueService } from './sync-queue.service';
import { SyncRepository } from '../repositories/sync.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { DEFAULT_SETTINGS } from '../models/settings.model';

describe('SyncQueueService', () => {
  let service: SyncQueueService;
  let mockSyncRepo: jasmine.SpyObj<SyncRepository>;
  let mockSettingsRepo: jasmine.SpyObj<SettingsRepository>;

  beforeEach(() => {
    mockSyncRepo = jasmine.createSpyObj('SyncRepository', [
      'getAllQueueItems',
      'enqueue',
      'getPendingQueue',
      'updateQueueItem',
      'deleteQueueItem'
    ]);
    mockSettingsRepo = jasmine.createSpyObj('SettingsRepository', ['getSettings']);

    mockSyncRepo.getAllQueueItems.and.returnValue(Promise.resolve([]));
    mockSettingsRepo.getSettings.and.returnValue(Promise.resolve(DEFAULT_SETTINGS));

    TestBed.configureTestingModule({
      providers: [
        SyncQueueService,
        { provide: SyncRepository, useValue: mockSyncRepo },
        { provide: SettingsRepository, useValue: mockSettingsRepo }
      ]
    });

    service = TestBed.inject(SyncQueueService);
  });

  it('should initialize with idle status and empty queue', () => {
    expect(service.syncStatus()).toBe('idle');
    expect(service.pendingCount()).toBe(0);
  });

  it('should record an action into the local sync queue with pending status', async () => {
    mockSyncRepo.enqueue.and.returnValue(Promise.resolve());
    mockSyncRepo.getAllQueueItems.and.returnValue(Promise.resolve([
      {
        id: 'sync-1',
        action: 'UPDATE_PROGRESS',
        entityType: 'book',
        entityId: 'book-123',
        payload: { progress: 45 },
        retryCount: 0,
        timestamp: new Date().toISOString(),
        status: 'pending'
      }
    ]));

    await service.recordAction('UPDATE_PROGRESS', 'book', 'book-123', { progress: 45 });

    expect(mockSyncRepo.enqueue).toHaveBeenCalled();
    expect(service.pendingCount()).toBe(1);
  });
});

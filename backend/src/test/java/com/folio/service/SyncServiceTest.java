package com.folio.service;

import com.folio.dto.SyncItemDto;
import com.folio.entity.SyncLogEntity;
import com.folio.repository.SyncLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

    @Mock
    private SyncLogRepository syncLogRepository;

    @InjectMocks
    private SyncService syncService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    void testProcessBatch_AlreadyProcessed_SkipsExecution() {
        String actionId = UUID.randomUUID().toString();
        when(syncLogRepository.existsByIdempotencyKey(actionId)).thenReturn(true);

        SyncItemDto item = new SyncItemDto();
        item.setId(actionId);
        item.setAction("CREATE_BOOK");

        List<SyncItemDto> processed = syncService.processBatch(userId, List.of(item));

        assertEquals(1, processed.size());
        assertEquals("SKIPPED_DUPLICATE", processed.get(0).getStatus());
        verify(syncLogRepository, never()).save(any(SyncLogEntity.class));
    }

    @Test
    void testProcessBatch_NewItem_SavesLogAndSyncs() {
        String actionId = UUID.randomUUID().toString();
        when(syncLogRepository.existsByIdempotencyKey(actionId)).thenReturn(false);

        SyncItemDto item = new SyncItemDto();
        item.setId(actionId);
        item.setAction("UPDATE_PROGRESS");
        item.setEntityType("book");
        item.setEntityId(UUID.randomUUID());

        List<SyncItemDto> processed = syncService.processBatch(userId, List.of(item));

        assertEquals(1, processed.size());
        assertEquals("SYNCED", processed.get(0).getStatus());
        verify(syncLogRepository, times(1)).save(any(SyncLogEntity.class));
    }
}

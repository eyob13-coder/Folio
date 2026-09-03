package com.folio.service;

import com.folio.dto.SyncItemDto;
import com.folio.entity.SyncLogEntity;
import com.folio.repository.BookRepository;
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
    private BookRepository bookRepository;

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
        when(syncLogRepository.existsByActionId(actionId)).thenReturn(true);

        SyncItemDto item = new SyncItemDto();
        item.setActionId(actionId);
        item.setActionType("CREATE_BOOK");

        List<SyncItemDto> processed = syncService.processBatch(userId, List.of(item));

        assertEquals(1, processed.size());
        assertEquals("SKIPPED_DUPLICATE", processed.get(0).getStatus());
        verify(syncLogRepository, never()).save(any(SyncLogEntity.class));
    }
}

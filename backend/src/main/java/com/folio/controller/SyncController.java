package com.folio.controller;

import com.folio.dto.SyncItemDto;
import com.folio.service.SyncService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sync")
@CrossOrigin(origins = "*")
public class SyncController {
    private final SyncService syncService;

    public SyncController(SyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/item")
    public ResponseEntity<Map<String, Object>> syncItem(@Valid @RequestBody SyncItemDto item) {
        return ResponseEntity.ok(syncService.processSyncItem(item));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<SyncItemDto>> syncBatch(
            @RequestBody List<SyncItemDto> items,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(syncService.processBatch(userId, items));
    }
}

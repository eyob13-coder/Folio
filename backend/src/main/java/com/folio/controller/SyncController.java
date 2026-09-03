package com.folio.controller;

import com.folio.dto.SyncItemDto;
import com.folio.service.SyncService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
        Map<String, Object> result = syncService.processSyncItem(item);
        return ResponseEntity.ok(result);
    }
}

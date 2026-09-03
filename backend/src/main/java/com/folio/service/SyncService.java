package com.folio.service;

import com.folio.dto.SyncItemDto;
import com.folio.entity.SyncLogEntity;
import com.folio.repository.SyncLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SyncService {
    private final SyncLogRepository syncLogRepository;

    public SyncService(SyncLogRepository syncLogRepository) {
        this.syncLogRepository = syncLogRepository;
    }

    @Transactional
    public Map<String, Object> processSyncItem(SyncItemDto item) {
        Map<String, Object> response = new HashMap<>();

        // Check Idempotency Key
        Optional<SyncLogEntity> existing = syncLogRepository.findByIdempotencyKey(item.getId());
        if (existing.isPresent()) {
            response.put("status", "success");
            response.put("message", "Idempotent request already processed");
            return response;
        }

        // Record processed sync log
        SyncLogEntity log = new SyncLogEntity();
        log.setId(UUID.randomUUID());
        log.setIdempotencyKey(item.getId());
        log.setAction(item.getAction());
        log.setEntityType(item.getEntityType());
        log.setEntityId(item.getEntityId());
        log.setStatus("synced");
        log.setCreatedAt(Instant.now());
        syncLogRepository.save(log);

        response.put("status", "success");
        response.put("syncedAt", Instant.now().toString());
        return response;
    }
}

package com.folio.service;

import com.folio.dto.SyncItemDto;
import com.folio.entity.SyncLogEntity;
import com.folio.repository.SyncLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class SyncService {
    private final SyncLogRepository syncLogRepository;

    public SyncService(SyncLogRepository syncLogRepository) {
        this.syncLogRepository = syncLogRepository;
    }

    @Transactional
    public Map<String, Object> processSyncItem(SyncItemDto item) {
        Map<String, Object> response = new HashMap<>();

        Optional<SyncLogEntity> existing = syncLogRepository.findByIdempotencyKey(item.getId());
        if (existing.isPresent()) {
            response.put("status", "success");
            response.put("message", "Idempotent request already processed");
            return response;
        }

        SyncLogEntity log = new SyncLogEntity();
        log.setId(UUID.randomUUID());
        log.setIdempotencyKey(item.getId());
        log.setAction(item.getAction());
        log.setEntityType(item.getEntityType() != null ? item.getEntityType() : "unknown");
        log.setEntityId(item.getEntityId() != null ? item.getEntityId() : UUID.randomUUID());
        log.setStatus("synced");
        log.setCreatedAt(Instant.now());
        syncLogRepository.save(log);

        response.put("status", "success");
        response.put("syncedAt", Instant.now().toString());
        return response;
    }

    @Transactional
    public List<SyncItemDto> processBatch(UUID userId, List<SyncItemDto> items) {
        List<SyncItemDto> results = new ArrayList<>();
        for (SyncItemDto item : items) {
            String key = item.getId() != null ? item.getId() : item.getActionId();
            if (key != null && syncLogRepository.existsByIdempotencyKey(key)) {
                item.setStatus("SKIPPED_DUPLICATE");
            } else {
                SyncLogEntity log = new SyncLogEntity();
                log.setId(UUID.randomUUID());
                log.setUserId(userId);
                log.setIdempotencyKey(key != null ? key : UUID.randomUUID().toString());
                log.setAction(item.getAction() != null ? item.getAction() : item.getActionType());
                log.setEntityType(item.getEntityType() != null ? item.getEntityType() : "entity");
                log.setEntityId(item.getEntityId() != null ? item.getEntityId() : UUID.randomUUID());
                log.setStatus("synced");
                log.setCreatedAt(Instant.now());
                syncLogRepository.save(log);

                item.setStatus("SYNCED");
            }
            results.add(item);
        }
        return results;
    }
}

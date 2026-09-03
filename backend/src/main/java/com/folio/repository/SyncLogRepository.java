package com.folio.repository;

import com.folio.entity.SyncLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SyncLogRepository extends JpaRepository<SyncLogEntity, UUID> {
    Optional<SyncLogEntity> findByIdempotencyKey(String idempotencyKey);
}

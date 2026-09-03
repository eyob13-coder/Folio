package com.folio.repository;

import com.folio.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookRepository extends JpaRepository<BookEntity, UUID> {
    List<BookEntity> findByUserId(UUID userId);
    Optional<BookEntity> findByContentHashAndUserId(String contentHash, UUID userId);
}

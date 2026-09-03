package com.folio.service;

import com.folio.entity.BookEntity;
import com.folio.repository.BookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class BookService {
    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public List<BookEntity> getAllBooks(UUID userId) {
        return bookRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Optional<BookEntity> getBookById(UUID id, UUID userId) {
        return bookRepository.findById(id).filter(b -> b.getUserId().equals(userId));
    }

    public BookEntity createBook(BookEntity book) {
        if (book.getId() == null) {
            book.setId(UUID.randomUUID());
        }
        Instant now = Instant.now();
        book.setCreatedAt(now);
        book.setUpdatedAt(now);
        return bookRepository.save(book);
    }

    public Optional<BookEntity> updateBook(UUID id, UUID userId, BookEntity updated) {
        return getBookById(id, userId).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setStatus(updated.getStatus());
            existing.setUpdatedAt(Instant.now());
            return bookRepository.save(existing);
        });
    }

    public boolean deleteBook(UUID id, UUID userId) {
        return getBookById(id, userId).map(book -> {
            bookRepository.delete(book);
            return true;
        }).orElse(false);
    }
}

package com.folio.controller;

import com.folio.entity.BookEntity;
import com.folio.service.BookService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/books")
public class BookController {
    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    private UUID resolveUserId(UUID headerUserId) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String principalStr) {
            try {
                return UUID.fromString(principalStr);
            } catch (IllegalArgumentException ignored) {}
        }
        return headerUserId != null ? headerUserId : UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    @GetMapping
    public ResponseEntity<List<BookEntity>> getAllBooks(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        return ResponseEntity.ok(bookService.getAllBooks(resolveUserId(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookEntity> getBookById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        return bookService.getBookById(id, resolveUserId(userId))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BookEntity> createBook(
            @RequestBody BookEntity book,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        book.setUserId(resolveUserId(userId));
        BookEntity created = bookService.createBook(book);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookEntity> updateBook(
            @PathVariable UUID id,
            @RequestBody BookEntity book,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        return bookService.updateBook(id, resolveUserId(userId), book)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        if (bookService.deleteBook(id, resolveUserId(userId))) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

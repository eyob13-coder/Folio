package com.folio.service;

import com.folio.entity.BookEntity;
import com.folio.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private BookService bookService;

    private UUID userId;
    private BookEntity sampleBook;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleBook = new BookEntity();
        sampleBook.setId(UUID.randomUUID());
        sampleBook.setUserId(userId);
        sampleBook.setTitle("Designing Data-Intensive Applications");
        sampleBook.setContentHash("hash123abc");
        sampleBook.setStatus("reading");
    }

    @Test
    void testGetAllBooks() {
        when(bookRepository.findByUserId(userId)).thenReturn(List.of(sampleBook));
        List<BookEntity> books = bookService.getAllBooks(userId);
        assertEquals(1, books.size());
        assertEquals("Designing Data-Intensive Applications", books.get(0).getTitle());
    }

    @Test
    void testCreateBook() {
        when(bookRepository.save(any(BookEntity.class))).thenAnswer(i -> i.getArgument(0));
        BookEntity created = bookService.createBook(sampleBook);
        assertNotNull(created.getId());
        assertNotNull(created.getCreatedAt());
        assertEquals(sampleBook.getTitle(), created.getTitle());
    }

    @Test
    void testDeleteBook_Success() {
        when(bookRepository.findById(sampleBook.getId())).thenReturn(Optional.of(sampleBook));
        boolean deleted = bookService.deleteBook(sampleBook.getId(), userId);
        assertTrue(deleted);
        verify(bookRepository).delete(sampleBook);
    }
}

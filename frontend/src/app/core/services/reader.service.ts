import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { BookRepository } from '../repositories/book.repository';
import { AnnotationRepository } from '../repositories/annotation.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { SyncQueueService } from '../sync/sync-queue.service';
import { Book, ReadingProgress } from '../models/book.model';
import { Bookmark, Highlight, Note } from '../models/annotation.model';
import { UserSettings, DEFAULT_SETTINGS } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class ReaderService {
  private bookRepo = inject(BookRepository);
  private annotationRepo = inject(AnnotationRepository);
  private settingsRepo = inject(SettingsRepository);
  private syncQueue = inject(SyncQueueService);

  readonly currentBook = signal<Book | null>(null);
  readonly currentProgress = signal<ReadingProgress | null>(null);
  readonly bookmarks = signal<Bookmark[]>([]);
  readonly highlights = signal<Highlight[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly settings = signal<UserSettings>(DEFAULT_SETTINGS);

  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly currentChapter = signal<string>('');
  readonly isSidebarOpen = signal<boolean>(false);
  readonly activeTab = signal<'toc' | 'bookmarks' | 'highlights' | 'notes' | 'ai' | 'settings'>('toc');

  private progressDebounceSubject = new Subject<ReadingProgress>();

  constructor() {
    this.loadSettings();

    // Debounce progress saving by 400ms to avoid constant writes during scroll
    this.progressDebounceSubject.pipe(
      debounceTime(400)
    ).subscribe(async (progress) => {
      await this.bookRepo.saveProgress(progress);
      await this.syncQueue.recordAction('UPDATE_PROGRESS', 'ReadingProgress', progress.id, progress);
    });
  }

  async loadSettings(): Promise<void> {
    const s = await this.settingsRepo.getSettings();
    this.settings.set(s);
  }

  async updateSettings(partial: Partial<UserSettings>): Promise<void> {
    const updated = await this.settingsRepo.saveSettings({ ...this.settings(), ...partial });
    this.settings.set(updated);
  }

  async openBook(bookId: string): Promise<Book | null> {
    const book = await this.bookRepo.getBookById(bookId);
    if (!book) return null;

    this.currentBook.set(book);

    // Update lastOpenedAt and status to reading
    const now = new Date().toISOString();
    await this.bookRepo.updateBook(bookId, {
      lastOpenedAt: now,
      status: book.status === 'unread' ? 'reading' : book.status
    });

    // Load progress
    let progress = await this.bookRepo.getProgressByBookId(bookId);
    if (!progress) {
      progress = {
        id: uuidv4(),
        bookId,
        currentPage: 1,
        totalPages: book.pageCount || 1,
        percentage: 0,
        lastReadAt: now,
        updatedAt: now
      };
      await this.bookRepo.saveProgress(progress);
    }
    this.currentProgress.set(progress);
    this.currentPage.set(progress.currentPage || 1);
    this.totalPages.set(progress.totalPages || book.pageCount || 1);

    // Load annotations
    await this.loadAnnotations(bookId);
    return book;
  }

  async loadAnnotations(bookId: string): Promise<void> {
    const [bm, hl, nt] = await Promise.all([
      this.annotationRepo.getBookmarksByBookId(bookId),
      this.annotationRepo.getHighlightsByBookId(bookId),
      this.annotationRepo.getNotesByBookId(bookId)
    ]);
    this.bookmarks.set(bm);
    this.highlights.set(hl);
    this.notes.set(nt);
  }

  async setProgress(page: number, totalPages?: number, chapter?: string, cfi?: string): Promise<void> {
    const book = this.currentBook();
    if (!book) return;

    const total = totalPages || this.totalPages() || 1;
    this.currentPage.set(page);
    this.totalPages.set(total);
    if (chapter) this.currentChapter.set(chapter);

    const percentage = Math.min(100, Math.round((page / total) * 100));

    const progress: ReadingProgress = {
      id: this.currentProgress()?.id || uuidv4(),
      bookId: book.id,
      currentPage: page,
      totalPages: total,
      percentage,
      chapter: chapter || this.currentChapter(),
      locationCfi: cfi,
      lastReadAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.currentProgress.set(progress);
    this.progressDebounceSubject.next(progress);

    // If reached 100%, mark as completed
    if (percentage === 100 && book.status !== 'completed') {
      await this.bookRepo.updateBook(book.id, { status: 'completed' });
    }
  }

  // Bookmarks
  async addBookmark(label?: string): Promise<Bookmark> {
    const book = this.currentBook();
    if (!book) throw new Error('No book opened');

    const page = this.currentPage();
    const bookmark: Bookmark = {
      id: uuidv4(),
      bookId: book.id,
      location: page,
      pageNumber: page,
      label: label || `Page ${page}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.annotationRepo.saveBookmark(bookmark);
    await this.syncQueue.recordAction('CREATE_BOOKMARK', 'Bookmark', bookmark.id, bookmark);
    this.bookmarks.update(bms => [...bms, bookmark]);
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<void> {
    await this.annotationRepo.deleteBookmark(id);
    await this.syncQueue.recordAction('DELETE_BOOKMARK', 'Bookmark', id, { id });
    this.bookmarks.update(bms => bms.filter(b => b.id !== id));
  }

  // Highlights
  async addHighlight(selectedText: string, color: 'yellow' | 'green' | 'blue' | 'purple' | 'pink' = 'yellow'): Promise<Highlight> {
    const book = this.currentBook();
    if (!book) throw new Error('No book opened');

    const page = this.currentPage();
    const highlight: Highlight = {
      id: uuidv4(),
      bookId: book.id,
      location: page,
      pageNumber: page,
      selectedText,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.annotationRepo.saveHighlight(highlight);
    await this.syncQueue.recordAction('CREATE_HIGHLIGHT', 'Highlight', highlight.id, highlight);
    this.highlights.update(hls => [...hls, highlight]);
    return highlight;
  }

  async deleteHighlight(id: string): Promise<void> {
    await this.annotationRepo.deleteHighlight(id);
    await this.syncQueue.recordAction('DELETE_HIGHLIGHT', 'Highlight', id, { id });
    this.highlights.update(hls => hls.filter(h => h.id !== id));
  }

  // Notes
  async addNote(content: string, highlightId?: string): Promise<Note> {
    const book = this.currentBook();
    if (!book) throw new Error('No book opened');

    const page = this.currentPage();
    const note: Note = {
      id: uuidv4(),
      bookId: book.id,
      highlightId,
      location: page,
      pageNumber: page,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.annotationRepo.saveNote(note);
    await this.syncQueue.recordAction('CREATE_NOTE', 'Note', note.id, note);
    this.notes.update(nts => [...nts, note]);
    return note;
  }

  async updateNote(id: string, content: string): Promise<void> {
    const updated = await this.annotationRepo.updateNote(id, { content });
    await this.syncQueue.recordAction('UPDATE_NOTE', 'Note', id, updated);
    this.notes.update(nts => nts.map(n => n.id === id ? updated : n));
  }

  async deleteNote(id: string): Promise<void> {
    await this.annotationRepo.deleteNote(id);
    await this.syncQueue.recordAction('DELETE_NOTE', 'Note', id, { id });
    this.notes.update(nts => nts.filter(n => n.id !== id));
  }

  async getBookBinary(): Promise<ArrayBuffer | Blob | null> {
    const book = this.currentBook();
    if (!book) return null;
    return this.bookRepo.getBookFileData(book.id);
  }
}

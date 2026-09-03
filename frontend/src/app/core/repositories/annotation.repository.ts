import { Injectable, inject } from '@angular/core';
import { STORAGE_PROVIDER } from '../storage/storage-provider.interface';
import { STORES } from '../storage/indexeddb-storage-provider';
import { Bookmark, Highlight, Note } from '../models/annotation.model';

@Injectable({
  providedIn: 'root'
})
export class AnnotationRepository {
  private storage = inject(STORAGE_PROVIDER);

  // Bookmarks
  async getBookmarksByBookId(bookId: string): Promise<Bookmark[]> {
    return this.storage.getAllByIndex<Bookmark>(STORES.BOOKMARKS, 'by_bookId', bookId);
  }

  async getAllBookmarks(): Promise<Bookmark[]> {
    return this.storage.getAll<Bookmark>(STORES.BOOKMARKS);
  }

  async saveBookmark(bookmark: Bookmark): Promise<Bookmark> {
    await this.storage.set<Bookmark>(STORES.BOOKMARKS, bookmark.id, bookmark);
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<void> {
    await this.storage.delete(STORES.BOOKMARKS, id);
  }

  // Highlights
  async getHighlightsByBookId(bookId: string): Promise<Highlight[]> {
    return this.storage.getAllByIndex<Highlight>(STORES.HIGHLIGHTS, 'by_bookId', bookId);
  }

  async getAllHighlights(): Promise<Highlight[]> {
    return this.storage.getAll<Highlight>(STORES.HIGHLIGHTS);
  }

  async saveHighlight(highlight: Highlight): Promise<Highlight> {
    await this.storage.set<Highlight>(STORES.HIGHLIGHTS, highlight.id, highlight);
    return highlight;
  }

  async deleteHighlight(id: string): Promise<void> {
    await this.storage.delete(STORES.HIGHLIGHTS, id);
  }

  // Notes
  async getNotesByBookId(bookId: string): Promise<Note[]> {
    return this.storage.getAllByIndex<Note>(STORES.NOTES, 'by_bookId', bookId);
  }

  async getAllNotes(): Promise<Note[]> {
    return this.storage.getAll<Note>(STORES.NOTES);
  }

  async getNoteById(id: string): Promise<Note | null> {
    return this.storage.get<Note>(STORES.NOTES, id);
  }

  async saveNote(note: Note): Promise<Note> {
    await this.storage.set<Note>(STORES.NOTES, note.id, note);
    return note;
  }

  async updateNote(id: string, partial: Partial<Note>): Promise<Note> {
    return this.storage.update<Note>(STORES.NOTES, id, partial);
  }

  async deleteNote(id: string): Promise<void> {
    await this.storage.delete(STORES.NOTES, id);
  }
}

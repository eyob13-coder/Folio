import { Injectable, inject } from '@angular/core';
import { BookRepository } from '../repositories/book.repository';
import { AnnotationRepository } from '../repositories/annotation.repository';
import { CollectionRepository } from '../repositories/collection.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { LibraryService } from './library.service';

export interface LibraryExportData {
  version: number;
  exportedAt: string;
  books: any[];
  authors: any[];
  collections: any[];
  tags: any[];
  bookmarks: any[];
  highlights: any[];
  notes: any[];
  progress: any[];
  settings: any;
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private bookRepo = inject(BookRepository);
  private annotationRepo = inject(AnnotationRepository);
  private collectionRepo = inject(CollectionRepository);
  private settingsRepo = inject(SettingsRepository);
  private libraryService = inject(LibraryService);

  async exportLibrary(): Promise<void> {
    const [books, authors, collections, tags, bookmarks, highlights, notes, settings] = await Promise.all([
      this.bookRepo.getAllBooks(),
      this.bookRepo.getAllAuthors(),
      this.collectionRepo.getAllCollections(),
      this.collectionRepo.getAllTags(),
      this.annotationRepo.getAllBookmarks(),
      this.annotationRepo.getAllHighlights(),
      this.annotationRepo.getAllNotes(),
      this.settingsRepo.getSettings()
    ]);

    const progressList = [];
    for (const b of books) {
      const p = await this.bookRepo.getProgressByBookId(b.id);
      if (p) progressList.push(p);
    }

    const exportData: LibraryExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      books,
      authors,
      collections,
      tags,
      bookmarks,
      highlights,
      notes,
      progress: progressList,
      settings
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-library-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async restoreLibrary(jsonFile: File): Promise<{ success: boolean; message: string }> {
    try {
      const text = await jsonFile.text();
      const data: LibraryExportData = JSON.parse(text);

      if (!data.books || !Array.isArray(data.books)) {
        throw new Error('Invalid backup file structure: missing books array.');
      }

      // Restore authors
      if (data.authors) {
        for (const author of data.authors) {
          await this.bookRepo.saveAuthor(author);
        }
      }

      // Restore collections & tags
      if (data.collections) {
        for (const col of data.collections) {
          await this.collectionRepo.saveCollection(col);
        }
      }
      if (data.tags) {
        for (const tag of data.tags) {
          await this.collectionRepo.saveTag(tag);
        }
      }

      // Restore books & progress
      for (const book of data.books) {
        await this.bookRepo.saveBook(book);
      }
      if (data.progress) {
        for (const prog of data.progress) {
          await this.bookRepo.saveProgress(prog);
        }
      }

      // Restore annotations
      if (data.bookmarks) {
        for (const bm of data.bookmarks) {
          await this.annotationRepo.saveBookmark(bm);
        }
      }
      if (data.highlights) {
        for (const hl of data.highlights) {
          await this.annotationRepo.saveHighlight(hl);
        }
      }
      if (data.notes) {
        for (const note of data.notes) {
          await this.annotationRepo.saveNote(note);
        }
      }

      if (data.settings) {
        await this.settingsRepo.saveSettings(data.settings);
      }

      await this.libraryService.refreshLibrary();
      return { success: true, message: `Successfully restored ${data.books.length} books and annotations.` };
    } catch (err: any) {
      return { success: false, message: `Restore failed: ${err.message || 'Corrupt JSON'}` };
    }
  }
}

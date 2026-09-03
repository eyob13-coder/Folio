import { Component, input, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Book } from '../../../core/models/book.model';
import { ReaderService } from '../../../core/services/reader.service';
import { REAL_BOOK_CONTENTS, BookChapter } from '../../../core/document/real-book-content.data';
import { LucideAngularModule, ChevronLeft, ChevronRight, Bookmark } from 'lucide-angular';

@Component({
  selector: 'app-chapter-reader',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 select-text">
      <!-- Chapter Toolbar -->
      <div class="h-12 border-b border-slate-800/80 bg-slate-900/60 px-6 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono text-brand-400 font-semibold uppercase">Chapter</span>
          <select 
            [value]="currentChapterIndex()" 
            (change)="onSelectChapter($event)"
            class="bg-slate-900 border border-slate-700/60 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-500">
            @for (ch of chapters(); track ch.id; let i = $index) {
              <option [value]="i">{{ ch.title }}</option>
            }
          </select>
        </div>

        <!-- Quick Annotation Actions -->
        <div class="flex items-center gap-2">
          <button 
            (click)="bookmarkCurrent()" 
            class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-1.5 transition-colors">
            <lucide-icon [img]="BookmarkIcon" class="w-3 h-3 text-brand-400"></lucide-icon>
            <span>Bookmark</span>
          </button>
        </div>
      </div>

      <!-- Main Scrollable Chapter Reader Body -->
      <div class="flex-1 overflow-y-auto px-6 py-8 md:px-16 lg:px-32 max-w-4xl mx-auto w-full leading-relaxed space-y-6">
        @if (currentChapter(); as ch) {
          <div class="border-b border-slate-800 pb-4 mb-6">
            <span class="text-xs font-mono uppercase tracking-widest text-brand-400">Page {{ ch.pageNumber }}</span>
            <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">{{ ch.title }}</h1>
            <p class="text-xs text-slate-400 mt-1">Book: {{ book().title }}</p>
          </div>

          <div class="text-slate-200 text-base md:text-lg space-y-4 whitespace-pre-line font-serif leading-8 selection:bg-brand-500/30">
            {{ ch.content }}
          </div>

          <!-- Bottom Chapter Pagination -->
          <div class="pt-8 mt-12 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button 
              (click)="prevChapter()" 
              [disabled]="currentChapterIndex() === 0"
              class="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 disabled:opacity-40 flex items-center gap-2 transition-colors">
              <lucide-icon [img]="PrevIcon" class="w-4 h-4"></lucide-icon>
              <span>Previous Chapter</span>
            </button>

            <span class="font-mono">
              {{ currentChapterIndex() + 1 }} / {{ chapters().length }}
            </span>

            <button 
              (click)="nextChapter()" 
              [disabled]="currentChapterIndex() >= chapters().length - 1"
              class="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 disabled:opacity-40 flex items-center gap-2 transition-colors">
              <span>Next Chapter</span>
              <lucide-icon [img]="NextIcon" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class ChapterReaderComponent implements OnInit {
  private readerService = inject(ReaderService);

  readonly book = input.required<Book>();
  readonly currentChapterIndex = signal<number>(0);

  readonly BookmarkIcon = Bookmark;
  readonly PrevIcon = ChevronLeft;
  readonly NextIcon = ChevronRight;

  readonly chapters = computed<BookChapter[]>(() => {
    const full = REAL_BOOK_CONTENTS[this.book().id];
    if (full && full.chapters.length > 0) {
      return full.chapters;
    }
    return [
      {
        id: 'default-ch1',
        title: this.book().title,
        pageNumber: 1,
        content: this.book().description || 'Full book content ready for offline reading and local AI search.'
      }
    ];
  });

  readonly currentChapter = computed<BookChapter | null>(() => {
    const list = this.chapters();
    return list[this.currentChapterIndex()] || null;
  });

  ngOnInit(): void {
    const prog = this.readerService.currentProgress();
    if (prog && prog.currentPage) {
      const idx = this.chapters().findIndex(c => c.pageNumber === prog.currentPage);
      if (idx !== -1) this.currentChapterIndex.set(idx);
    }
  }

  onSelectChapter(e: Event): void {
    const idx = parseInt((e.target as HTMLSelectElement).value, 10);
    this.currentChapterIndex.set(idx);
    this.syncProgress();
  }

  prevChapter(): void {
    if (this.currentChapterIndex() > 0) {
      this.currentChapterIndex.update(i => i - 1);
      this.syncProgress();
    }
  }

  nextChapter(): void {
    if (this.currentChapterIndex() < this.chapters().length - 1) {
      this.currentChapterIndex.update(i => i + 1);
      this.syncProgress();
    }
  }

  bookmarkCurrent(): void {
    const ch = this.currentChapter();
    if (ch) {
      this.readerService.addBookmark(ch.title);
    }
  }

  private syncProgress(): void {
    const ch = this.currentChapter();
    if (ch) {
      this.readerService.setProgress(ch.pageNumber, this.book().pageCount || 100, ch.title);
    }
  }
}

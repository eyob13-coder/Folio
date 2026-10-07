import { Component, inject, signal, computed, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { LibraryService } from '../../../core/services/library.service';
import { StatsBarComponent } from '../stats-bar/stats-bar.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { BookCardComponent } from '../book-card/book-card.component';
import { BookDetailModalComponent } from '../book-detail-modal/book-detail-modal.component';
import { Book } from '../../../core/models/book.model';
import { LucideAngularModule, Plus, BookOpen, Sparkles, Heart, X } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    StatsBarComponent, 
    FilterBarComponent, 
    BookCardComponent, 
    BookDetailModalComponent,
    LucideAngularModule
  ],
  template: `
    <div class="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <!-- Top Stats Bar -->
      <app-stats-bar></app-stats-bar>

      <!-- Continue Reading Section -->
      @if (continueReadingBooks().length > 0 && selectedFilter() === 'all' && !activeCollectionId() && !activeTag()) {
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <lucide-icon [img]="BookOpenIcon" class="w-4 h-4 text-brand-400"></lucide-icon>
              <span>Continue Reading</span>
            </h2>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            @for (book of continueReadingBooks(); track book.id) {
              <app-book-card 
                [book]="book" 
                [progress]="libraryService.progressMap().get(book.id) || null"
                (toggleFavorite)="libraryService.toggleFavorite($event)"
                (selectBook)="selectedBook.set($event)"
                (askAI)="openAIChat.emit($event)">
              </app-book-card>
            }
          </div>
        </section>
      }

      <!-- Sample Data Banner (Shown when demo books are loaded) -->
      @if (hasDemoBooks()) {
        <div class="p-3.5 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5 text-brand-300">
            <lucide-icon [img]="SparklesIcon" class="w-4 h-4 text-brand-400 shrink-0"></lucide-icon>
            <span>You are viewing the pre-seeded sample library. Ready to use your own private books?</span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              (click)="clearDemoData()"
              class="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl font-medium transition-all flex items-center gap-1.5 shrink-0">
              <lucide-icon [img]="XIcon" class="w-3.5 h-3.5"></lucide-icon>
              <span>Remove Mock Data</span>
            </button>
          </div>
        </div>
      }

      <!-- Main Library Section -->
      <section class="space-y-4 pt-2">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-bold text-white tracking-tight">Your Books</h2>
            @if (activeCollection(); as col) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-slate-900 border border-slate-700 text-slate-200">
                <span class="w-2 h-2 rounded-full" [style.backgroundColor]="col.color"></span>
                <span>{{ col.name }}</span>
                <button (click)="clearCollectionFilter()" class="hover:text-rose-400 ml-1">✕</button>
              </span>
            }
            @if (activeTag(); as tag) {
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-900 border border-slate-700 text-slate-200 font-mono">
                <span>{{ tag }}</span>
                <button (click)="clearTagFilter()" class="hover:text-rose-400 ml-1">✕</button>
              </span>
            }
          </div>
          <div class="flex items-center gap-2">
            @if (hasDemoBooks()) {
              <button 
                (click)="clearDemoData()"
                class="px-3 py-1.5 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
                title="Clear pre-seeded sample books">
                <lucide-icon [img]="XIcon" class="w-3.5 h-3.5"></lucide-icon>
                <span class="hidden sm:inline">Clear Mock Books</span>
              </button>
            }
            <button 
              (click)="openImport.emit()"
              class="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-brand-600/20">
              <lucide-icon [img]="PlusIcon" class="w-3.5 h-3.5"></lucide-icon>
              <span>Add Books</span>
            </button>
          </div>
        </div>

        <!-- Filters & View Mode -->
        <app-filter-bar 
          [(selectedFilter)]="selectedFilter"
          [(selectedFormat)]="selectedFormat"
          [(sortBy)]="sortBy"
          [(viewMode)]="viewMode">
        </app-filter-bar>

        <!-- Books Grid / List -->
        @if (filteredBooks().length > 0) {
          <div [class]="viewMode() === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-3'">
            @for (book of filteredBooks(); track book.id) {
              <app-book-card 
                [book]="book" 
                [progress]="libraryService.progressMap().get(book.id) || null"
                (toggleFavorite)="libraryService.toggleFavorite($event)"
                (selectBook)="selectedBook.set($event)"
                (askAI)="openAIChat.emit($event)">
              </app-book-card>
            }
          </div>
        } @else {
          <!-- Empty State -->
          <div class="text-center py-16 px-4 bg-slate-900/30 border border-slate-800/60 rounded-3xl space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-slate-800 text-brand-400 flex items-center justify-center mx-auto shadow-inner">
              <lucide-icon [img]="BookOpenIcon" class="w-7 h-7"></lucide-icon>
            </div>
            <div>
              <h3 class="font-bold text-lg text-white">Your library is clean & empty</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">Import your own EPUB or PDF documents to read offline and chat with Local RAG AI.</p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button 
                (click)="openImport.emit()"
                class="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-lg shadow-brand-600/20">
                <lucide-icon [img]="PlusIcon" class="w-4 h-4"></lucide-icon>
                <span>Import Your Books</span>
              </button>
              <button 
                (click)="loadDemoData()"
                class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl inline-flex items-center gap-2 border border-slate-700">
                <lucide-icon [img]="SparklesIcon" class="w-4 h-4 text-brand-400"></lucide-icon>
                <span>Load Sample Starter Library</span>
              </button>
            </div>
          </div>
        }
      </section>

      <!-- Book Detail Modal -->
      @if (selectedBook()) {
        <app-book-detail-modal 
          [book]="selectedBook()!" 
          (close)="selectedBook.set(null)"
          (askAI)="openAIChat.emit($event)">
        </app-book-detail-modal>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  readonly libraryService = inject(LibraryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly openImport = output<void>();
  readonly openAIChat = output<Book>();

  readonly selectedBook = signal<Book | null>(null);
  readonly selectedFilter = signal<string>('all');
  readonly selectedFormat = signal<string>('all');
  readonly sortBy = signal<string>('recent');
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly activeCollectionId = signal<string | null>(null);
  readonly activeTag = signal<string | null>(null);

  readonly BookOpenIcon = BookOpen;
  readonly PlusIcon = Plus;
  readonly SparklesIcon = Sparkles;
  readonly HeartIcon = Heart;
  readonly XIcon = X;

  readonly hasDemoBooks = computed(() => {
    return this.libraryService.books().some(b => b.id.startsWith('book-'));
  });

  async clearDemoData(): Promise<void> {
    await this.libraryService.clearDemoLibrary();
  }

  async loadDemoData(): Promise<void> {
    await this.libraryService.loadDemoLibrary();
  }

  readonly activeCollection = computed(() => {
    const id = this.activeCollectionId();
    if (!id) return null;
    return this.libraryService.collections().find(c => c.id === id) || null;
  });

  readonly continueReadingBooks = computed(() => {
    return this.libraryService.books()
      .filter(b => b.status === 'reading' && b.lastOpenedAt)
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.route.url.subscribe(segments => {
      const path = segments.map(s => s.path).join('/');
      if (path === 'favorites') this.selectedFilter.set('favorites');
      else if (path === 'reading') this.selectedFilter.set('reading');
    });

    this.route.queryParams.subscribe(params => {
      this.activeCollectionId.set(params['collection'] || null);
      this.activeTag.set(params['tag'] || null);
    });
  }

  clearCollectionFilter(): void {
    this.activeCollectionId.set(null);
    this.router.navigate([], { queryParams: { collection: null }, queryParamsHandling: 'merge' });
  }

  clearTagFilter(): void {
    this.activeTag.set(null);
    this.router.navigate([], { queryParams: { tag: null }, queryParamsHandling: 'merge' });
  }

  readonly filteredBooks = computed(() => {
    let list = [...this.libraryService.books()];

    const colId = this.activeCollectionId();
    if (colId) {
      list = list.filter(b => b.collectionIds && b.collectionIds.includes(colId));
    }

    const tag = this.activeTag();
    if (tag) {
      list = list.filter(b => b.tags && b.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
    }

    if (this.selectedFilter() === 'reading') list = list.filter(b => b.status === 'reading');
    else if (this.selectedFilter() === 'unread') list = list.filter(b => b.status === 'unread');
    else if (this.selectedFilter() === 'completed') list = list.filter(b => b.status === 'completed');
    else if (this.selectedFilter() === 'favorites') list = list.filter(b => b.isFavorite);

    if (this.selectedFormat() !== 'all') {
      list = list.filter(b => b.fileType === this.selectedFormat());
    }

    if (this.sortBy() === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.sortBy() === 'progress') {
      const pMap = this.libraryService.progressMap();
      list.sort((a, b) => (pMap.get(b.id)?.percentage || 0) - (pMap.get(a.id)?.percentage || 0));
    } else if (this.sortBy() === 'recent') {
      list.sort((a, b) => new Date(b.lastOpenedAt || b.updatedAt).getTime() - new Date(a.lastOpenedAt || a.updatedAt).getTime());
    }

    return list;
  });
}

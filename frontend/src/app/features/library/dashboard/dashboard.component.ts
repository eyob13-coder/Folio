import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LibraryService } from '../../../core/services/library.service';
import { StatsBarComponent } from '../stats-bar/stats-bar.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { BookCardComponent } from '../book-card/book-card.component';
import { BookDetailModalComponent } from '../book-detail-modal/book-detail-modal.component';
import { Book } from '../../../core/models/book.model';
import { LucideAngularModule, Plus, BookOpen, Sparkles, Heart } from 'lucide-angular';

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

      <!-- Continue Reading Section (if any books in progress) -->
      @if (continueReadingBooks().length > 0 && selectedFilter() === 'all') {
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

      <!-- Main Library Section -->
      <section class="space-y-4 pt-2">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 class="text-lg font-bold text-white tracking-tight">Your Books</h2>
          <button 
            (click)="openImport.emit()"
            class="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
            <lucide-icon [img]="PlusIcon" class="w-3.5 h-3.5"></lucide-icon>
            <span>Add Books</span>
          </button>
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
            <div class="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <lucide-icon [img]="BookOpenIcon" class="w-6 h-6"></lucide-icon>
            </div>
            <div>
              <h3 class="font-bold text-base text-white">No books match this view</h3>
              <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">Import PDF or EPUB files to expand your local offline library.</p>
            </div>
            <button 
              (click)="openImport.emit()"
              class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-semibold text-xs rounded-xl inline-flex items-center gap-2">
              <lucide-icon [img]="PlusIcon" class="w-4 h-4"></lucide-icon>
              <span>Import Books</span>
            </button>
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
export class DashboardComponent {
  readonly libraryService = inject(LibraryService);
  readonly openImport = output<void>();
  readonly openAIChat = output<Book>();

  readonly selectedBook = signal<Book | null>(null);
  readonly selectedFilter = signal<string>('all');
  readonly selectedFormat = signal<string>('all');
  readonly sortBy = signal<string>('recent');
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly BookOpenIcon = BookOpen;
  readonly PlusIcon = Plus;
  readonly SparklesIcon = Sparkles;
  readonly HeartIcon = Heart;

  readonly continueReadingBooks = computed(() => {
    return this.libraryService.books()
      .filter(b => b.status === 'reading' && b.lastOpenedAt)
      .slice(0, 5);
  });

  readonly filteredBooks = computed(() => {
    let list = [...this.libraryService.books()];

    if (this.selectedFilter() === 'reading') list = list.filter(b => b.status === 'reading');
    else if (this.selectedFilter() === 'unread') list = list.filter(b => b.status === 'unread');
    else if (this.selectedFilter() === 'completed') list = list.filter(b => b.status === 'completed');
    else if (this.selectedFilter() === 'favorites') list = list.filter(b => b.isFavorite);

    if (this.selectedFormat() !== 'all') {
      list = list.filter(b => b.fileType === this.selectedFormat());
    }

    if (this.sortBy() === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.sortBy() === 'recent') {
      list.sort((a, b) => new Date(b.lastOpenedAt || b.updatedAt).getTime() - new Date(a.lastOpenedAt || a.updatedAt).getTime());
    }

    return list;
  });
}

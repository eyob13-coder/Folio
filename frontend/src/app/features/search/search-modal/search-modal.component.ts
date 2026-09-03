import { Component, inject, signal, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FullTextSearchService, SearchResultItem } from '../../../core/search/search.service';
import { LucideAngularModule, Search, X, BookOpen, Clock, FileText, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <!-- Search Input Bar -->
        <div class="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <lucide-icon [img]="SearchIcon" class="w-5 h-5 text-brand-400"></lucide-icon>
          <input 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            autofocus
            placeholder="Search title, author, tags, or text inside books (e.g. distributed systems)..."
            class="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none">
          
          <button (click)="close.emit()" class="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <!-- Latency & Index Benchmark Header -->
        @if (searchService.searchStats().totalWordsIndexed > 0) {
          <div class="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span class="flex items-center gap-1.5 text-brand-400">
              <lucide-icon [img]="ClockIcon" class="w-3.5 h-3.5"></lucide-icon>
              {{ searchService.searchStats().lastSearchDurationMs }}ms response
            </span>
            <span>
              {{ searchService.searchStats().totalBooksIndexed }} books • {{ searchService.searchStats().totalWordsIndexed.toLocaleString() }} indexed words
            </span>
          </div>
        }

        <!-- Search Results List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          @for (res of results(); track res.id) {
            <a 
              [routerLink]="['/reader', res.bookId]"
              (click)="close.emit()"
              class="block p-3 rounded-2xl bg-slate-950/50 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition-all group">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-slate-200 group-hover:text-brand-400 transition-colors truncate">
                  {{ res.bookTitle }}
                </span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-brand-400">
                  {{ res.matchType === 'content' ? (res.pageNumber ? 'Page ' + res.pageNumber : res.chapterTitle || 'Content') : 'Metadata' }}
                </span>
              </div>
              <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed" [innerHTML]="res.highlightedSnippet"></p>
            </a>
          }

          @if (results().length === 0 && searchQuery.trim().length > 0) {
            <p class="text-xs text-slate-500 italic text-center py-10">No matches found for "{{ searchQuery }}"</p>
          }
        </div>
      </div>
    </div>
  `
})
export class SearchModalComponent {
  readonly searchService = inject(FullTextSearchService);
  readonly close = output<void>();

  searchQuery = '';
  readonly results = signal<SearchResultItem[]>([]);

  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly BookOpenIcon = BookOpen;
  readonly ClockIcon = Clock;
  readonly FileTextIcon = FileText;

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.close.emit();
  }

  async onSearchChange(): Promise<void> {
    if (this.searchQuery.trim().length > 0) {
      const items = await this.searchService.search(this.searchQuery);
      this.results.set(items);
    } else {
      this.results.set([]);
    }
  }
}

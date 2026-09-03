import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Book } from '../../../core/models/book.model';
import { LibraryService } from '../../../core/services/library.service';
import { 
  LucideAngularModule, 
  X, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Trash2, 
  Calendar, 
  FileText, 
  Layers, 
  CheckCircle 
} from 'lucide-angular';

@Component({
  selector: 'app-book-detail-modal',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        <!-- Close Button -->
        <button 
          (click)="close.emit()"
          class="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon>
        </button>

        <div class="flex flex-col sm:flex-row gap-6">
          <!-- Cover -->
          <div class="w-36 sm:w-44 flex-shrink-0">
            <div class="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg">
              @if (book().coverDataUrl) {
                <img [src]="book().coverDataUrl" [alt]="book().title" class="w-full h-full object-cover">
              } @else {
                <div class="w-full h-full p-4 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col justify-between border-l-4 border-brand-500">
                  <span class="text-[10px] font-mono text-brand-400 uppercase font-bold">{{ book().fileType }}</span>
                  <span class="text-xs font-bold text-slate-300">{{ book().title }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Info Details -->
          <div class="flex-1 space-y-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {{ book().fileType }}
                </span>
                <span class="text-xs font-medium text-slate-400 capitalize">
                  Status: <strong class="text-slate-200">{{ book().status }}</strong>
                </span>
              </div>
              <h2 class="text-xl font-bold text-white tracking-tight leading-snug">{{ book().title }}</h2>
              @if (book().subtitle) {
                <p class="text-sm text-slate-400 mt-0.5">{{ book().subtitle }}</p>
              }
            </div>

            <!-- Key metadata pills -->
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span class="text-[10px] text-slate-500 uppercase block">Pages</span>
                <span class="font-medium font-mono">{{ book().pageCount || 'Computed in reader' }}</span>
              </div>
              <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span class="text-[10px] text-slate-500 uppercase block">File Size</span>
                <span class="font-medium font-mono">{{ (book().fileSize / (1024 * 1024)).toFixed(1) }} MB</span>
              </div>
            </div>

            <!-- Description -->
            @if (book().description) {
              <div>
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                <p class="text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                  {{ book().description }}
                </p>
              </div>
            }

            <!-- Tags -->
            @if (book().tags && book().tags.length > 0) {
              <div class="flex flex-wrap gap-1.5 pt-1">
                @for (tag of book().tags; track tag) {
                  <span class="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                    {{ tag }}
                  </span>
                }
              </div>
            }

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-800">
              <a 
                [routerLink]="['/reader', book().id]"
                (click)="close.emit()"
                class="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-slate-950 font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all">
                <lucide-icon [img]="BookOpenIcon" class="w-4 h-4"></lucide-icon>
                <span>Open Reader</span>
              </a>

              <button 
                (click)="askAI.emit(book()); close.emit()"
                class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition-colors">
                <lucide-icon [img]="SparklesIcon" class="w-4 h-4"></lucide-icon>
                <span>Ask Local AI</span>
              </button>

              <button 
                (click)="libraryService.toggleFavorite(book().id)"
                class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                [title]="book().isFavorite ? 'Remove Favorite' : 'Add to Favorites'">
                <lucide-icon [img]="HeartIcon" class="w-4 h-4" [class.fill-rose-500]="book().isFavorite" [class.text-rose-500]="book().isFavorite"></lucide-icon>
              </button>

              <button 
                (click)="deleteBook()"
                class="ml-auto p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                title="Delete Book">
                <lucide-icon [img]="Trash2Icon" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookDetailModalComponent {
  readonly book = input.required<Book>();
  readonly close = output<void>();
  readonly askAI = output<Book>();

  readonly libraryService = inject(LibraryService);

  readonly XIcon = X;
  readonly BookOpenIcon = BookOpen;
  readonly HeartIcon = Heart;
  readonly SparklesIcon = Sparkles;
  readonly Trash2Icon = Trash2;
  readonly CalendarIcon = Calendar;
  readonly FileTextIcon = FileText;
  readonly LayersIcon = Layers;
  readonly CheckCircleIcon = CheckCircle;

  async deleteBook(): Promise<void> {
    if (confirm(`Are you sure you want to delete "${this.book().title}"?`)) {
      await this.libraryService.deleteBook(this.book().id);
      this.close.emit();
    }
  }
}

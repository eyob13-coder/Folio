import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Book, ReadingProgress } from '../../../core/models/book.model';
import { LucideAngularModule, Heart, BookOpen, MoreVertical, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="group relative bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-xl hover:shadow-brand-950/20 flex flex-col justify-between">
      <div>
        <!-- Book Cover Container -->
        <div class="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/60 mb-3.5 flex items-center justify-center group-hover:scale-[1.01] transition-transform">
          @if (book().coverDataUrl) {
            <img [src]="book().coverDataUrl" [alt]="book().title" class="w-full h-full object-cover">
          } @else {
            <!-- Generated Premium Default Cover -->
            <div class="w-full h-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-4 flex flex-col justify-between text-left border-l-4 border-brand-500">
              <div>
                <span class="text-[10px] font-mono tracking-widest uppercase text-brand-400 font-semibold">
                  {{ book().fileType.toUpperCase() }}
                </span>
                <h4 class="font-bold text-sm text-slate-200 mt-1 line-clamp-3 leading-snug">
                  {{ book().title }}
                </h4>
              </div>
              <p class="text-[11px] text-slate-400 font-medium truncate">
                {{ authorDisplay() }}
              </p>
            </div>
          }

          <!-- Floating Badges -->
          <div class="absolute top-2 left-2 flex gap-1">
            <span class="px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider rounded-md uppercase bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-300">
              {{ book().fileType }}
            </span>
          </div>

          <!-- Favorite Button -->
          <button 
            (click)="$event.stopPropagation(); toggleFavorite.emit(book().id)"
            class="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-400 hover:text-rose-400 transition-colors"
            title="Favorite">
            <lucide-icon [img]="HeartIcon" class="w-3.5 h-3.5" [class.fill-rose-500]="book().isFavorite" [class.text-rose-500]="book().isFavorite"></lucide-icon>
          </button>

          <!-- Hover Action Overlay -->
          <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
            <a 
              [routerLink]="['/reader', book().id]"
              class="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-500/30 transition-transform active:scale-95">
              <lucide-icon [img]="BookOpenIcon" class="w-3.5 h-3.5"></lucide-icon>
              <span>Read</span>
            </a>
            <button 
              (click)="$event.stopPropagation(); askAI.emit(book())"
              class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-transform active:scale-95"
              title="Ask Local AI about this book">
              <lucide-icon [img]="SparklesIcon" class="w-3.5 h-3.5 text-emerald-400"></lucide-icon>
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        <!-- Book Meta -->
        <div>
          <h3 
            (click)="selectBook.emit(book())"
            class="font-semibold text-sm text-slate-100 hover:text-brand-400 line-clamp-1 cursor-pointer transition-colors" 
            [title]="book().title">
            {{ book().title }}
          </h3>
          <p class="text-xs text-slate-400 truncate mt-0.5">
            {{ authorDisplay() }}
          </p>
        </div>
      </div>

      <!-- Bottom Progress & Status -->
      <div class="mt-3 pt-2.5 border-t border-slate-800/60">
        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span class="capitalize">{{ book().status }}</span>
          <span class="font-mono">{{ progressPercentage() }}%</span>
        </div>
        <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-brand-600 to-emerald-400 rounded-full transition-all duration-300"
            [style.width.%]="progressPercentage()">
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookCardComponent {
  readonly book = input.required<Book>();
  readonly progress = input<ReadingProgress | null>(null);

  readonly toggleFavorite = output<string>();
  readonly selectBook = output<Book>();
  readonly askAI = output<Book>();

  readonly HeartIcon = Heart;
  readonly BookOpenIcon = BookOpen;
  readonly MoreVerticalIcon = MoreVertical;
  readonly SparklesIcon = Sparkles;

  readonly progressPercentage = computed(() => {
    return this.progress()?.percentage || (this.book().status === 'completed' ? 100 : 0);
  });

  readonly authorDisplay = computed(() => {
    const b = this.book();
    if (b.authors && b.authors.length > 0) {
      return b.authors.map(a => a.name).join(', ');
    }
    const realAuthorMap: Record<string, string> = {
      'auth-1': 'Martin Kleppmann',
      'auth-2': 'Robert C. Martin',
      'auth-3': 'Alex Xu',
      'auth-4': 'Brendan Gregg',
      'book-ddia': 'Martin Kleppmann',
      'book-clean-arch': 'Robert C. Martin',
      'book-sys-design': 'Alex Xu',
      'book-sys-perf': 'Brendan Gregg'
    };
    if (b.authorIds && b.authorIds.length > 0 && realAuthorMap[b.authorIds[0]]) {
      return realAuthorMap[b.authorIds[0]];
    }
    if (realAuthorMap[b.id]) {
      return realAuthorMap[b.id];
    }
    return b.publisher || 'Software Engineering';
  });
}

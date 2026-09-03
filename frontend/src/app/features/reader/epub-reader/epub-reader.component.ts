import { Component, ElementRef, ViewChild, input, output, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Book } from '../../../core/models/book.model';
import ePub from 'epubjs';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-epub-reader',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex-1 flex flex-col items-center justify-between h-full overflow-hidden p-4 relative">
      <!-- EPUB Render Area -->
      <div class="flex-1 w-full max-w-3xl flex items-center justify-center overflow-hidden bg-slate-900/40 rounded-2xl border border-slate-800/80 p-4">
        <div #epubViewer class="w-full h-full"></div>
      </div>

      <!-- Bottom Chapter / Navigation Bar -->
      <div class="mt-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl z-20">
        <button (click)="prevSection()" class="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300">
          <lucide-icon [img]="PrevIcon" class="w-4 h-4"></lucide-icon>
        </button>

        <span class="text-xs font-mono text-slate-200">
          EPUB Reader Mode
        </span>

        <button (click)="nextSection()" class="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300">
          <lucide-icon [img]="NextIcon" class="w-4 h-4"></lucide-icon>
        </button>
      </div>
    </div>
  `
})
export class EpubReaderComponent implements OnDestroy {
  @ViewChild('epubViewer') viewerRef!: ElementRef<HTMLDivElement>;

  readonly book = input.required<Book>();
  readonly fileData = input<ArrayBuffer | Blob | null>(null);

  readonly pageChange = output<{ page: number; total: number; cfi?: string }>();

  private rendition: any = null;
  private epubBook: any = null;

  readonly PrevIcon = ChevronLeft;
  readonly NextIcon = ChevronRight;

  constructor() {
    effect(() => {
      const data = this.fileData();
      if (data && this.viewerRef) {
        this.renderEpub(data);
      }
    });
  }

  async renderEpub(data: ArrayBuffer | Blob): Promise<void> {
    try {
      const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
      this.epubBook = ePub(buffer);
      await this.epubBook.ready;

      this.rendition = this.epubBook.renderTo(this.viewerRef.nativeElement, {
        width: '100%',
        height: '100%',
        flow: 'paginated'
      });

      this.rendition.display();
      this.rendition.on('relocated', (location: any) => {
        this.pageChange.emit({
          page: location.start?.displayed?.page || 1,
          total: location.start?.displayed?.total || 100,
          cfi: location.start?.cfi
        });
      });
    } catch (err) {
      console.warn('EPUB reader rendering:', err);
    }
  }

  prevSection(): void {
    this.rendition?.prev();
  }

  nextSection(): void {
    this.rendition?.next();
  }

  ngOnDestroy(): void {
    this.epubBook?.destroy?.();
  }
}

import { Component, ElementRef, ViewChild, input, output, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Book } from '../../../core/models/book.model';
import * as pdfjsLib from 'pdfjs-dist';
import { LucideAngularModule, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-angular';

@Component({
  selector: 'app-pdf-reader',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex-1 flex flex-col items-center justify-between h-full overflow-hidden p-4 relative select-text">
      <!-- PDF Viewport Canvas Container -->
      <div class="flex-1 w-full flex items-center justify-center overflow-auto p-2">
        <div class="relative bg-white rounded-lg shadow-2xl overflow-hidden reader-canvas-container max-w-full">
          <canvas #pdfCanvas class="block max-w-full h-auto"></canvas>
        </div>
      </div>

      <!-- Bottom Floating Pagination & Zoom Bar -->
      <div class="mt-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl z-20">
        <button 
          (click)="prevPage()" 
          [disabled]="currentPage() <= 1"
          class="p-1.5 rounded-xl hover:bg-slate-800 disabled:opacity-30 text-slate-300">
          <lucide-icon [img]="PrevIcon" class="w-4 h-4"></lucide-icon>
        </button>

        <span class="text-xs font-mono text-slate-200">
          Page <strong>{{ currentPage() }}</strong> / {{ totalPages() }}
        </span>

        <button 
          (click)="nextPage()" 
          [disabled]="currentPage() >= totalPages()"
          class="p-1.5 rounded-xl hover:bg-slate-800 disabled:opacity-30 text-slate-300">
          <lucide-icon [img]="NextIcon" class="w-4 h-4"></lucide-icon>
        </button>

        <div class="h-4 w-px bg-slate-800 mx-1"></div>

        <button (click)="adjustScale(-0.15)" class="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white" title="Zoom Out">
          <lucide-icon [img]="ZoomOutIcon" class="w-3.5 h-3.5"></lucide-icon>
        </button>
        <span class="text-[11px] font-mono text-slate-400">{{ (scale() * 100).toFixed(0) }}%</span>
        <button (click)="adjustScale(0.15)" class="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white" title="Zoom In">
          <lucide-icon [img]="ZoomInIcon" class="w-3.5 h-3.5"></lucide-icon>
        </button>
      </div>
    </div>
  `
})
export class PdfReaderComponent implements OnDestroy {
  @ViewChild('pdfCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly book = input.required<Book>();
  readonly fileData = input<ArrayBuffer | Blob | null>(null);
  readonly initialPage = input<number>(1);

  readonly pageChange = output<number>();
  readonly totalPagesChange = output<number>();

  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly scale = signal<number>(1.2);

  private pdfDoc: any = null;
  readonly PrevIcon = ChevronLeft;
  readonly NextIcon = ChevronRight;
  readonly ZoomInIcon = ZoomIn;
  readonly ZoomOutIcon = ZoomOut;

  constructor() {
    effect(() => {
      const data = this.fileData();
      if (data) {
        this.loadPdf(data);
      }
    });
  }

  async loadPdf(data: ArrayBuffer | Blob): Promise<void> {
    try {
      const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      this.pdfDoc = await loadingTask.promise;
      this.totalPages.set(this.pdfDoc.numPages);
      this.totalPagesChange.emit(this.pdfDoc.numPages);
      this.currentPage.set(this.initialPage() || 1);
      await this.renderCurrentPage();
    } catch (err) {
      console.error('Failed to load PDF in reader:', err);
    }
  }

  async renderCurrentPage(): Promise<void> {
    if (!this.pdfDoc || !this.canvasRef) return;
    try {
      const page = await this.pdfDoc.getPage(this.currentPage());
      const viewport = page.getViewport({ scale: this.scale() });
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    } catch (err) {
      console.warn('Page render cancelled or error:', err);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.pageChange.emit(this.currentPage());
      this.renderCurrentPage();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.pageChange.emit(this.currentPage());
      this.renderCurrentPage();
    }
  }

  adjustScale(delta: number): void {
    const newScale = Math.min(2.5, Math.max(0.6, this.scale() + delta));
    this.scale.set(newScale);
    this.renderCurrentPage();
  }

  ngOnDestroy(): void {
    this.pdfDoc?.destroy?.();
  }
}

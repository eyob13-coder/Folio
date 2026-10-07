import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReaderService } from '../../../core/services/reader.service';
import { BookRepository } from '../../../core/repositories/book.repository';
import { ReaderHeaderComponent } from '../reader-header/reader-header.component';
import { PdfReaderComponent } from '../pdf-reader/pdf-reader.component';
import { EpubReaderComponent } from '../epub-reader/epub-reader.component';
import { AnnotationsDrawerComponent } from '../annotations-drawer/annotations-drawer.component';
import { RagChatModalComponent } from '../../ai-chat/rag-chat-modal/rag-chat-modal.component';
import { ChapterReaderComponent } from '../chapter-reader/chapter-reader.component';
import { Book } from '../../../core/models/book.model';
import { ReaderTheme } from '../../../core/models/settings.model';
import { LucideAngularModule, FileUp, Upload, BookOpen } from 'lucide-angular';

@Component({
  selector: 'app-reader-container',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ReaderHeaderComponent,
    PdfReaderComponent,
    EpubReaderComponent,
    AnnotationsDrawerComponent,
    RagChatModalComponent,
    ChapterReaderComponent
  ],
  template: `
    @if (readerService.currentBook(); as book) {
      <div class="h-screen flex flex-col bg-slate-950 overflow-hidden" [class]="'theme-' + currentTheme()">
        <!-- Reader Header -->
        <app-reader-header 
          [book]="book"
          [isCurrentPageBookmarked]="isPageBookmarked()"
          [currentTheme]="currentTheme()"
          (toggleBookmark)="readerService.addBookmark()"
          (openAI)="showAIModal.set(true)"
          (cycleTheme)="cycleTheme()"
          (toggleDrawer)="toggleDrawer()">
        </app-reader-header>

        <!-- Main Body -->
        <div class="flex-1 flex overflow-hidden relative">
          <!-- Active Reader -->
          @if (fileBinary()) {
            @if (book.fileType === 'pdf') {
              <app-pdf-reader 
                [book]="book"
                [fileData]="fileBinary()"
                [initialPage]="readerService.currentPage()"
                (pageChange)="onPdfPageChange($event)"
                (totalPagesChange)="onPdfTotalPagesChange($event)">
              </app-pdf-reader>
            } @else {
              <app-epub-reader 
                [book]="book"
                [fileData]="fileBinary()"
                (pageChange)="onEpubPageChange($event)">
              </app-epub-reader>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
              <div class="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-inner">
                <lucide-icon [img]="FileUpIcon" class="w-8 h-8"></lucide-icon>
              </div>
              <div class="space-y-2">
                <span class="text-xs font-mono uppercase tracking-widest text-brand-400 font-semibold">{{ book.fileType.toUpperCase() }} Document</span>
                <h2 class="text-2xl font-bold text-white tracking-tight">{{ book.title }}</h2>
                <p class="text-sm text-slate-400 leading-relaxed">
                  The visual {{ book.fileType.toUpperCase() }} file is not currently cached in offline storage. Attach your {{ book.fileType.toUpperCase() }} file to render the complete visual document and read offline.
                </p>
              </div>

              <div class="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <label class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2">
                  <lucide-icon [img]="UploadIcon" class="w-4 h-4"></lucide-icon>
                  <span>Select {{ book.fileType.toUpperCase() }} File</span>
                  <input type="file" [accept]="book.fileType === 'pdf' ? '.pdf' : '.epub'" (change)="onAttachFile($event, book)" class="hidden">
                </label>

                <button 
                  (click)="showTextFallback.set(!showTextFallback())" 
                  class="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5">
                  <lucide-icon [img]="BookOpenIcon" class="w-3.5 h-3.5"></lucide-icon>
                  <span>{{ showTextFallback() ? 'Hide Text Mode' : 'View Text Mode' }}</span>
                </button>
              </div>

              @if (showTextFallback()) {
                <div class="w-full mt-6 border-t border-slate-800/80 pt-6 text-left">
                  <app-chapter-reader [book]="book"></app-chapter-reader>
                </div>
              }
            </div>
          }

          <!-- Side Drawer (Annotations/TOC) -->
          @if (isDrawerOpen()) {
            <app-annotations-drawer (close)="isDrawerOpen.set(false)"></app-annotations-drawer>
          }
        </div>

        <!-- AI Chat Modal -->
        @if (showAIModal()) {
          <app-rag-chat-modal [book]="book" (close)="showAIModal.set(false)"></app-rag-chat-modal>
        }
      </div>
    }
  `
})
export class ReaderContainerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly readerService = inject(ReaderService);
  private bookRepo = inject(BookRepository);

  readonly fileBinary = signal<ArrayBuffer | Blob | null>(null);
  readonly isDrawerOpen = signal<boolean>(false);
  readonly showAIModal = signal<boolean>(false);
  readonly currentTheme = signal<ReaderTheme>('dark');
  readonly showTextFallback = signal<boolean>(false);

  readonly FileUpIcon = FileUp;
  readonly UploadIcon = Upload;
  readonly BookOpenIcon = BookOpen;

  async ngOnInit(): Promise<void> {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (bookId) {
      await this.readerService.openBook(bookId);
      const binary = await this.readerService.getBookBinary();
      this.fileBinary.set(binary);
    }
  }

  async onAttachFile(event: Event, book: Book): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      await this.bookRepo.saveBook(book, file);
      this.fileBinary.set(file);
    }
  }

  isPageBookmarked(): boolean {
    const page = this.readerService.currentPage();
    return this.readerService.bookmarks().some(b => b.pageNumber === page);
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update(v => !v);
  }

  onPdfPageChange(page: number): void {
    this.readerService.setProgress(page);
  }

  onPdfTotalPagesChange(total: number): void {
    this.readerService.totalPages.set(total);
  }

  onEpubPageChange(event: { page: number; total: number; cfi?: string }): void {
    this.readerService.setProgress(event.page, event.total, undefined, event.cfi);
  }

  cycleTheme(): void {
    const themes: ReaderTheme[] = ['dark', 'light', 'sepia', 'solarized'];
    const nextIdx = (themes.indexOf(this.currentTheme()) + 1) % themes.length;
    this.currentTheme.set(themes[nextIdx]);
  }
}

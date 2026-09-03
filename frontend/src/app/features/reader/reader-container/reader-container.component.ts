import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReaderService } from '../../../core/services/reader.service';
import { ReaderHeaderComponent } from '../reader-header/reader-header.component';
import { PdfReaderComponent } from '../pdf-reader/pdf-reader.component';
import { EpubReaderComponent } from '../epub-reader/epub-reader.component';
import { AnnotationsDrawerComponent } from '../annotations-drawer/annotations-drawer.component';
import { RagChatModalComponent } from '../../ai-chat/rag-chat-modal/rag-chat-modal.component';
import { ChapterReaderComponent } from '../chapter-reader/chapter-reader.component';
import { Book } from '../../../core/models/book.model';
import { ReaderTheme } from '../../../core/models/settings.model';

@Component({
  selector: 'app-reader-container',
  standalone: true,
  imports: [
    CommonModule,
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
            <app-chapter-reader [book]="book"></app-chapter-reader>
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

  readonly fileBinary = signal<ArrayBuffer | Blob | null>(null);
  readonly isDrawerOpen = signal<boolean>(false);
  readonly showAIModal = signal<boolean>(false);
  readonly currentTheme = signal<ReaderTheme>('dark');

  async ngOnInit(): Promise<void> {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (bookId) {
      await this.readerService.openBook(bookId);
      const binary = await this.readerService.getBookBinary();
      this.fileBinary.set(binary);
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

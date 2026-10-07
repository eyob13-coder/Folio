import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { SearchModalComponent } from './features/search/search-modal/search-modal.component';
import { ImportModalComponent } from './features/import/import-modal/import-modal.component';
import { RagChatModalComponent } from './features/ai-chat/rag-chat-modal/rag-chat-modal.component';
import { AuthModalComponent } from './features/auth/auth-modal/auth-modal.component';
import { Book } from './core/models/book.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    NavbarComponent, 
    SidebarComponent, 
    SearchModalComponent, 
    ImportModalComponent,
    RagChatModalComponent,
    AuthModalComponent
  ],
  template: `
    <div class="h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-brand-500/30 selection:text-brand-300">
      <!-- Navbar (Fixed at top) -->
      <app-navbar 
        class="shrink-0 z-30"
        (openSearch)="isSearchOpen.set(true)"
        (openImport)="isImportOpen.set(true)"
        (openAuth)="isAuthOpen.set(true)">
      </app-navbar>

      <!-- Main Layout -->
      <div class="flex-1 flex overflow-hidden min-h-0">
        <!-- Sidebar (Stays locked in place) -->
        <app-sidebar class="hidden md:flex shrink-0 h-full"></app-sidebar>

        <!-- Dynamic Content Router Area (only this area scrolls) -->
        <main class="flex-1 h-full overflow-y-auto min-h-0 bg-slate-950">
          <router-outlet 
            (activate)="onRouteActivated($event)">
          </router-outlet>
        </main>
      </div>

      <!-- Global Modals -->
      @if (isSearchOpen()) {
        <app-search-modal (close)="isSearchOpen.set(false)"></app-search-modal>
      }

      @if (isImportOpen()) {
        <app-import-modal (close)="isImportOpen.set(false)"></app-import-modal>
      }

      @if (isAuthOpen()) {
        <app-auth-modal (close)="isAuthOpen.set(false)"></app-auth-modal>
      }

      @if (activeAIBook()) {
        <app-rag-chat-modal [book]="activeAIBook()!" (close)="activeAIBook.set(null)"></app-rag-chat-modal>
      }
    </div>
  `
})
export class AppComponent {
  readonly isSearchOpen = signal<boolean>(false);
  readonly isImportOpen = signal<boolean>(false);
  readonly isAuthOpen = signal<boolean>(false);
  readonly activeAIBook = signal<Book | null>(null);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.isSearchOpen.update(v => !v);
    }
  }

  onRouteActivated(componentRef: any): void {
    if (componentRef?.openImport) {
      componentRef.openImport.subscribe(() => this.isImportOpen.set(true));
    }
    if (componentRef?.openAIChat) {
      componentRef.openAIChat.subscribe((book: Book) => this.activeAIBook.set(book));
    }
  }
}

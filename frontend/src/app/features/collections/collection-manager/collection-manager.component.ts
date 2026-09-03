import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Collection } from '../../../core/models/collection.model';
import { CollectionRepository } from '../../../core/repositories/collection.repository';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-collection-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-100">Collections</h1>
          <p class="text-sm text-slate-400 mt-1">Organize your library into custom collections</p>
        </div>
        <button
          (click)="showCreateForm.set(!showCreateForm())"
          class="px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl
            hover:bg-brand-500 transition-colors flex items-center gap-2"
        >
          <span class="text-lg">+</span> New Collection
        </button>
      </div>

      @if (showCreateForm()) {
        <div class="mb-6 p-5 bg-slate-800/60 border border-slate-700/50 rounded-2xl">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              [(ngModel)]="newName"
              placeholder="Collection name"
              class="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm
                text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
            <input
              [(ngModel)]="newDescription"
              placeholder="Description (optional)"
              class="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm
                text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div class="flex gap-2 mt-4">
            <span class="text-xs text-slate-400 self-center mr-2">Color:</span>
            @for (color of colorOptions; track color) {
              <button
                (click)="newColor = color"
                class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                [class]="newColor === color ? 'border-white scale-110' : 'border-transparent'"
                [style.background-color]="color"
              ></button>
            }
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button (click)="showCreateForm.set(false)"
              class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button (click)="createCollection()"
              class="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-500 transition-colors">
              Create
            </button>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (collection of collections(); track collection.id) {
          <div class="group p-5 bg-slate-800/40 border border-slate-700/40 rounded-2xl
            hover:border-slate-600/60 hover:bg-slate-800/60 transition-all cursor-pointer">
            <div class="flex items-start gap-3">
              <div class="w-3 h-3 rounded-full mt-1.5 shrink-0"
                [style.background-color]="collection.color || '#6366f1'"></div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-slate-100 truncate">{{ collection.name }}</h3>
                @if (collection.description) {
                  <p class="text-xs text-slate-400 mt-1 line-clamp-2">{{ collection.description }}</p>
                }
                <div class="flex items-center gap-2 mt-3">
                  <app-badge variant="default" size="sm">
                    {{ collection.bookCount || 0 }} books
                  </app-badge>
                </div>
              </div>
              <button
                (click)="deleteCollection(collection.id); $event.stopPropagation()"
                class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400
                  transition-all text-sm"
              >✕</button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-16 text-center">
            <p class="text-4xl mb-3">📚</p>
            <p class="text-slate-400">No collections yet</p>
            <p class="text-xs text-slate-500 mt-1">Create one to organize your library</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class CollectionManagerComponent implements OnInit {
  private collectionRepo = inject(CollectionRepository);

  collections = signal<Collection[]>([]);
  showCreateForm = signal(false);
  newName = '';
  newDescription = '';
  newColor = '#6366f1';

  colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  ];

  async ngOnInit(): Promise<void> {
    await this.loadCollections();
  }

  async loadCollections(): Promise<void> {
    const items = await this.collectionRepo.getAllCollections();
    this.collections.set(items);
  }

  async createCollection(): Promise<void> {
    if (!this.newName.trim()) return;
    await this.collectionRepo.saveCollection({
      id: crypto.randomUUID(),
      name: this.newName.trim(),
      description: this.newDescription.trim() || undefined,
      color: this.newColor,
      orderIndex: this.collections().length,
      bookCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.newName = '';
    this.newDescription = '';
    this.showCreateForm.set(false);
    await this.loadCollections();
  }

  async deleteCollection(id: string): Promise<void> {
    await this.collectionRepo.deleteCollection(id);
    await this.loadCollections();
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="onCancel()"></div>
        <div class="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl
          max-w-md w-full p-6 animate-[scaleIn_0.2s_ease-out]">
          <h3 class="text-lg font-bold text-slate-100">{{ title }}</h3>
          <p class="text-sm text-slate-400 mt-2 leading-relaxed">{{ message }}</p>
          <div class="flex justify-end gap-3 mt-6">
            <button
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-medium text-slate-400 bg-slate-800
                border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              (click)="onConfirm()"
              class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              [class]="variant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-brand-600 text-white hover:bg-brand-500'"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() variant: 'default' | 'danger' = 'default';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

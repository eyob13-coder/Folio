import { Component, Injectable, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(type: ToastType, title: string, message?: string, duration = 4000): void {
    const toast: ToastMessage = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      duration,
    };
    this.toasts.update(list => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), duration);
  }

  success(title: string, message?: string): void { this.show('success', title, message); }
  error(title: string, message?: string): void { this.show('error', title, message, 6000); }
  warning(title: string, message?: string): void { this.show('warning', title, message); }
  info(title: string, message?: string): void { this.show('info', title, message); }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-xl
            animate-[slideInRight_0.3s_ease-out]"
          [class]="typeClasses[toast.type]"
          (click)="toastService.dismiss(toast.id)"
        >
          <span class="text-lg mt-0.5">{{ typeIcons[toast.type] }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="text-xs opacity-80 mt-0.5">{{ toast.message }}</p>
            }
          </div>
          <button class="text-xs opacity-60 hover:opacity-100 transition-opacity mt-0.5">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}

  typeClasses: Record<ToastType, string> = {
    success: 'bg-emerald-950/90 border-emerald-700/50 text-emerald-100',
    error: 'bg-red-950/90 border-red-700/50 text-red-100',
    warning: 'bg-amber-950/90 border-amber-700/50 text-amber-100',
    info: 'bg-sky-950/90 border-sky-700/50 text-sky-100',
  };

  typeIcons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
}

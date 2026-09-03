import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center font-medium rounded-full whitespace-nowrap"
      [class]="variantClasses[variant] + ' ' + sizeClasses[size]"
    >
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'sm';

  variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-slate-700/60 text-slate-300 border border-slate-600/40',
    success: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40',
    warning: 'bg-amber-900/50 text-amber-300 border border-amber-700/40',
    error: 'bg-red-900/50 text-red-300 border border-red-700/40',
    info: 'bg-sky-900/50 text-sky-300 border border-sky-700/40',
    brand: 'bg-brand-900/50 text-brand-300 border border-brand-700/40',
  };

  sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
}

import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, X, User, Mail, Lock, LogIn, UserPlus, LogOut, CheckCircle, ShieldCheck, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        (click)="$event.stopPropagation()"
        class="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 relative text-slate-200">
        
        <!-- Close button -->
        <button 
          (click)="close.emit()" 
          class="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon>
        </button>

        @if (authService.isAuthenticated()) {
          <!-- Authenticated State: User Profile View -->
          <div class="space-y-6">
            <div class="text-center space-y-2">
              <div class="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-teal-400 p-[2px] shadow-xl shadow-brand-500/20">
                <div class="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-2xl font-black text-brand-400">
                  {{ userInitials() }}
                </div>
              </div>
              <h2 class="text-xl font-bold text-white tracking-tight">{{ authService.currentUser()?.displayName }}</h2>
              <p class="text-xs text-slate-400 font-mono">{{ authService.currentUser()?.email }}</p>
            </div>

            <div class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Account Status</span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                  <lucide-icon [img]="ShieldCheckIcon" class="w-3.5 h-3.5"></lucide-icon>
                  Verified User
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">User ID</span>
                <span class="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">{{ authService.currentUser()?.id }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Cloud Sync</span>
                <span class="text-emerald-400 font-medium">Active & Synchronized</span>
              </div>
            </div>

            <div class="flex gap-3">
              <button 
                (click)="onLogout()" 
                class="flex-1 h-11 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all">
                <lucide-icon [img]="LogOutIcon" class="w-4 h-4"></lucide-icon>
                <span>Sign Out</span>
              </button>
              <button 
                (click)="close.emit()" 
                class="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-2xl transition-all">
                Done
              </button>
            </div>
          </div>
        } @else {
          <!-- Unauthenticated State: Sign In or Register -->
          <div>
            <div class="text-center space-y-1 mb-6">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-mono mb-2">
                <lucide-icon [img]="SparklesIcon" class="w-3.5 h-3.5"></lucide-icon>
                Folio Cloud Sync Account
              </div>
              <h2 class="text-xl font-bold text-white tracking-tight">
                {{ isRegisterMode() ? 'Create an Account' : 'Welcome Back' }}
              </h2>
              <p class="text-xs text-slate-400">
                {{ isRegisterMode() ? 'Synchronize your reading library across all devices' : 'Sign in to access your annotations & synced library' }}
              </p>
            </div>

            <!-- Tab Switcher -->
            <div class="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-5">
              <button 
                type="button"
                (click)="setMode(false)"
                [class.bg-slate-800]="!isRegisterMode()"
                [class.text-white]="!isRegisterMode()"
                [class.text-slate-400]="isRegisterMode()"
                class="flex-1 py-2 text-xs font-semibold rounded-xl transition-all">
                Sign In
              </button>
              <button 
                type="button"
                (click)="setMode(true)"
                [class.bg-slate-800]="isRegisterMode()"
                [class.text-white]="isRegisterMode()"
                [class.text-slate-400]="!isRegisterMode()"
                class="flex-1 py-2 text-xs font-semibold rounded-xl transition-all">
                Register
              </button>
            </div>

            @if (feedbackError()) {
              <div class="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span>{{ feedbackError() }}</span>
              </div>
            }

            <form (ngSubmit)="onSubmit()" class="space-y-4">
              @if (isRegisterMode()) {
                <div>
                  <label class="block text-[11px] font-medium text-slate-400 mb-1.5">Display Name</label>
                  <div class="relative">
                    <lucide-icon [img]="UserIcon" class="w-4 h-4 text-slate-500 absolute left-3.5 top-3"></lucide-icon>
                    <input 
                      type="text" 
                      [(ngModel)]="displayName" 
                      name="displayName"
                      placeholder="e.g. Eyob Reader" 
                      class="w-full h-10 pl-10 pr-3 bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors">
                  </div>
                </div>
              }

              <div>
                <label class="block text-[11px] font-medium text-slate-400 mb-1.5">Email Address</label>
                <div class="relative">
                  <lucide-icon [img]="MailIcon" class="w-4 h-4 text-slate-500 absolute left-3.5 top-3"></lucide-icon>
                  <input 
                    type="email" 
                    [(ngModel)]="email" 
                    name="email"
                    required
                    placeholder="user@example.com" 
                    class="w-full h-10 pl-10 pr-3 bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-medium text-slate-400 mb-1.5">Password</label>
                <div class="relative">
                  <lucide-icon [img]="LockIcon" class="w-4 h-4 text-slate-500 absolute left-3.5 top-3"></lucide-icon>
                  <input 
                    type="password" 
                    [(ngModel)]="password" 
                    name="password"
                    required
                    minlength="6"
                    placeholder="•••••••• (min 6 characters)" 
                    class="w-full h-10 pl-10 pr-3 bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors">
                </div>
              </div>

              <button 
                type="submit" 
                [disabled]="authService.isLoading()"
                class="w-full h-11 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/20 active:scale-[0.98]">
                @if (authService.isLoading()) {
                  <span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                } @else {
                  <lucide-icon [img]="isRegisterMode() ? UserPlusIcon : LogInIcon" class="w-4 h-4"></lucide-icon>
                  <span>{{ isRegisterMode() ? 'Create Account' : 'Sign In' }}</span>
                }
              </button>
            </form>

            <!-- Quick Portfolio Demo Test Account -->
            <div class="mt-4 pt-4 border-t border-slate-800/80 text-center">
              <button 
                type="button"
                (click)="fillDemoCredentials()"
                class="text-[11px] text-slate-400 hover:text-brand-400 transition-colors inline-flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                <span>Reviewing Portfolio? Click to fill Demo Credentials</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AuthModalComponent {
  readonly authService = inject(AuthService);
  readonly close = output<void>();

  readonly isRegisterMode = signal<boolean>(false);
  readonly feedbackError = signal<string | null>(null);

  email = '';
  password = '';
  displayName = '';

  readonly XIcon = X;
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly LogInIcon = LogIn;
  readonly UserPlusIcon = UserPlus;
  readonly LogOutIcon = LogOut;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly SparklesIcon = Sparkles;

  setMode(register: boolean) {
    this.isRegisterMode.set(register);
    this.feedbackError.set(null);
  }

  fillDemoCredentials() {
    this.email = 'demo@folio.app';
    this.password = 'password123';
    this.displayName = 'Portfolio Reviewer';
    this.feedbackError.set(null);
  }

  userInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'F';
    const name = user.displayName || user.email || 'F';
    return name.slice(0, 2).toUpperCase();
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.feedbackError.set('Please provide both email and password.');
      return;
    }

    this.feedbackError.set(null);

    try {
      if (this.isRegisterMode()) {
        await this.authService.register({
          email: this.email,
          password: this.password,
          displayName: this.displayName
        });
      } else {
        await this.authService.login({
          email: this.email,
          password: this.password
        });
      }
      this.close.emit();
    } catch (err: any) {
      this.feedbackError.set(err.message || 'Authentication failed');
    }
  }

  onLogout() {
    this.authService.logout();
    this.close.emit();
  }
}

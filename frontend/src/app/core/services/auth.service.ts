import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginDto, RegisterDto } from '../models/user.model';

const SESSION_STORAGE_KEY = 'folio_auth_session';

interface StoredSession {
  user: User;
  token: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const session: StoredSession = JSON.parse(saved);
        if (new Date(session.expiresAt) > new Date()) {
          this.currentUser.set(session.user);
          this.token.set(session.token);
          this.fetchProfile().catch(() => {});
        } else {
          this.logout();
        }
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  async login(dto: LoginDto): Promise<User> {
    this.isLoading.set(true);
    this.error.set(null);

    const url = `${environment.api.baseUrl}/auth/login`;

    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(url, dto)
      );

      const user: User = {
        id: res.userId,
        email: res.email,
        displayName: res.displayName,
        avatarUrl: res.avatarUrl
      };

      this.persistSession(user, res.token, res.expiresAt);
      return user;
    } catch (err: any) {
      const msg = err?.error?.error || err?.message || 'Login failed. Please check your credentials.';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  async register(dto: RegisterDto): Promise<User> {
    this.isLoading.set(true);
    this.error.set(null);

    const url = `${environment.api.baseUrl}/auth/register`;

    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(url, dto)
      );

      const user: User = {
        id: res.userId,
        email: res.email,
        displayName: res.displayName,
        avatarUrl: res.avatarUrl
      };

      this.persistSession(user, res.token, res.expiresAt);
      return user;
    } catch (err: any) {
      const msg = err?.error?.error || err?.message || 'Registration failed. Email might already be taken.';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  async fetchProfile(): Promise<User | null> {
    const t = this.token();
    if (!t) return null;

    try {
      const profile = await firstValueFrom(
        this.http.get<User>(`${environment.api.baseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` }
        })
      );
      this.currentUser.set(profile);
      return profile;
    } catch {
      return this.currentUser();
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.currentUser.set(null);
    this.token.set(null);
    this.error.set(null);
  }

  private persistSession(user: User, token: string, expiresAt: string): void {
    const session: StoredSession = { user, token, expiresAt };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.currentUser.set(user);
    this.token.set(token);
  }
}

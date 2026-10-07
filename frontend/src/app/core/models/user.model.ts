export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  token: string;
  expiresAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName?: string;
}

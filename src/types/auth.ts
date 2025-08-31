// src/types/auth.ts

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthState {
  user: any | null;
  loading: boolean;
  error: AuthError | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  confirmPassword?: string;
}

// src/types/auth.ts

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user?: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  avatar_url?: string;
  // Thêm các field khác từ backend của bạn
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password?: string;
  phone_number?: string | null;
}

export interface UserUpdatePayload {
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

export interface ChangePasswordPayload {
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}
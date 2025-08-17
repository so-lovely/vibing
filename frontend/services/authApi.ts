import { apiClient } from './api';
import type { AuthResponse, LoginCredentials, SignupData, TokenResponse, User } from '../types/auth';

export const authApi = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post('/auth/login', credentials);
  },

  // Register new user
  async signup(data: SignupData): Promise<AuthResponse> {
    return apiClient.post('/auth/signup', data);
  },

  // Logout user
  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  // Get current user info
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{user: User}>('/auth/me');
    return response.user;
  },

  // Send phone verification code
  async sendVerificationCode(phone: string): Promise<{ message: string; requestId: string; code?: string }> {
    return apiClient.post('/auth/send-verification-code', { phone });
  },

  // Verify phone number
  async verifyPhone(phone: string, code: string): Promise<{ message: string }> {
    return apiClient.post('/auth/verify-phone', { phone, code });
  },
};
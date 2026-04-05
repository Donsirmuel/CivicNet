import apiClient from './apiClient';
import { isAxiosError } from 'axios';
import type{ User } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface TokenResponse {
  token: string;
}

export const authService = {
  // Register new user
  register: async (credentials: RegisterCredentials): Promise<{ token: string; user: User }> => {
    try {
      // Create user account
      const userData: Record<string, unknown> = {
        username: credentials.username,
        password: credentials.password,
        first_name: credentials.first_name,
        last_name: credentials.last_name,
      };

      // Only include email if provided
      if (credentials.email) {
        userData.email = credentials.email;
      }

      const registerResponse = await apiClient.post<User>('users/', userData);

      // Auto-login after registration
      const loginResponse = await apiClient.post<TokenResponse>('api-token-auth/', {
        username: credentials.username,
        password: credentials.password,
      });
      const token = loginResponse.data.token;

      // Store token
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(registerResponse.data));

      return {
        token,
        user: registerResponse.data,
      };
    } catch (error: unknown) {
      const errorMsg = isAxiosError(error) && error.response?.data
        ? JSON.stringify(error.response.data)
        : 'Registration failed';
      throw new Error(`Registration failed: ${errorMsg}`);
    }
  },

  // Login with username and password
  login: async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
    try {
      const response = await apiClient.post<TokenResponse>('api-token-auth/', credentials);
      const token = response.data.token;

      // Store token
      localStorage.setItem('authToken', token);

      // Fetch user info
      const userResponse = await apiClient.get<User>('users/me/');
      localStorage.setItem('currentUser', JSON.stringify(userResponse.data));

      return {
        token,
        user: userResponse.data,
      };
    } catch {
      throw new Error('Login failed');
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  },

  // Google OAuth registration/login
  googleAuth: async (googleToken: string): Promise<{ token: string; user: User }> => {
    try {
      // Send Google token to backend for verification and token exchange
      const response = await apiClient.post<{ token: string; user: User }>('auth/google/', {
        id_token: googleToken,
      });

      const { token, user } = response.data;

      // Store token and user
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));

      return {
        token,
        user,
      };
    } catch {
      throw new Error('Google authentication failed');
    }
  },

  // Get auth token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
};

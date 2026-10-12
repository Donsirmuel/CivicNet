/**
 * Failsafe API Client Wrapper
 * Gracefully handles backend unavailability during demos.
 * Falls back to cached/demo data if backend is down.
 */

import axios, { AxiosError,type AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const CACHE_KEY = 'civicnet_api_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  timestamp: number;
  data: any;
}

class FailsafeApiClient {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry> = new Map();
  private isBackendDown = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 5000,
    });

    // Request interceptor: add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });

    // Response interceptor: handle errors gracefully
    this.client.interceptors.response.use(
      (response) => {
        this.isBackendDown = false;
        return response;
      },
      (error: AxiosError) => {
        // If backend is unreachable, mark as down
        if (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ENOTFOUND' ||
          error.message.includes('timeout') ||
          !error.response
        ) {
          this.isBackendDown = true;
          console.warn('⚠️ Backend unavailable. Using cached/demo data.');
        }

        // Unauthorized: clear token and redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }

        throw error;
      }
    );

    // Load cache from localStorage on init
    this.loadCache();
  }

  private loadCache() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        this.cache = new Map(JSON.parse(cached));
      } catch {
        this.cache = new Map();
      }
    }
  }

  private saveCache() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(this.cache.entries())));
  }

  private getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      this.saveCache();
      return null;
    }

    return entry.data;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, {
      timestamp: Date.now(),
      data,
    });
    this.saveCache();
  }

  /**
   * GET request with fallback to cache
   */
  async get<T = any>(url: string): Promise<T> {
    const cacheKey = `GET:${url}`;

    try {
      const response = await this.client.get<T>(url);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      // Try cache as fallback
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.warn(`📦 Using cached data for: ${url}`);
        return cached;
      }

      // No cache, re-throw error
      throw error;
    }
  }

  /**
   * POST request (requires backend, no fallback)
   */
  async post<T = any>(url: string, data: any): Promise<T> {
    if (this.isBackendDown) {
      throw new Error(
        '❌ Backend is currently unavailable. Creating posts requires an active connection.'
      );
    }

    try {
      const response = await this.client.post<T>(url, data);
      return response.data;
    } catch (error) {
      console.error('POST failed:', error);
      throw error;
    }
  }

  /**
   * PATCH request (requires backend, no fallback)
   */
  async patch<T = any>(url: string, data: any): Promise<T> {
    if (this.isBackendDown) {
      throw new Error('❌ Backend is unavailable. Updates require an active connection.');
    }

    try {
      const response = await this.client.patch<T>(url, data);
      return response.data;
    } catch (error) {
      console.error('PATCH failed:', error);
      throw error;
    }
  }

  /**
   * DELETE request (requires backend, no fallback)
   */
  async delete<T = any>(url: string): Promise<T> {
    if (this.isBackendDown) {
      throw new Error('❌ Backend is unavailable. Deletions require an active connection.');
    }

    try {
      const response = await this.client.delete<T>(url);
      return response.data;
    } catch (error) {
      console.error('DELETE failed:', error);
      throw error;
    }
  }

  /**
   * Check if backend is currently unavailable
   */
  getBackendStatus(): { isDown: boolean; message: string } {
    return {
      isDown: this.isBackendDown,
      message: this.isBackendDown
        ? '⚠️ Backend offline. View-only mode enabled.'
        : '✅ Backend online.',
    };
  }

  /**
   * Clear all cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    localStorage.removeItem(CACHE_KEY);
  }
}

export default new FailsafeApiClient();

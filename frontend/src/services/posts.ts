import apiClient from './apiClient';
import type{ Post } from '../types';

interface PaginatedResponse<T> {
  results?: T[];
}

type ActionResponse = Record<string, unknown>;

function normalizeListResponse<T>(data: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

const LIST_CACHE_TTL_MS = 4000;
const listCache = new Map<string, { timestamp: number; data: Post[] }>();
const listInFlight = new Map<string, Promise<Post[]>>();

function serializeParams(params?: { ordering?: string; search?: string }) {
  const normalized = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(normalized);
}

function clearListCache() {
  listCache.clear();
  listInFlight.clear();
}

export const postsService = {
  // Get all posts
  getPosts: async (params?: {
    ordering?: string;
    search?: string;
  }): Promise<Post[]> => {
    const key = serializeParams(params);
    const cached = listCache.get(key);
    if (cached && Date.now() - cached.timestamp < LIST_CACHE_TTL_MS) {
      return cached.data;
    }

    const inFlight = listInFlight.get(key);
    if (inFlight) return inFlight;

    const request = (async () => {
      try {
        const response = await apiClient.get<Post[] | PaginatedResponse<Post>>('posts/', { params });
        const data = normalizeListResponse(response.data);
        listCache.set(key, { timestamp: Date.now(), data });
        return data;
      } finally {
        listInFlight.delete(key);
      }
    })();

    listInFlight.set(key, request);

    try {
      return await request;
    } catch {
      throw new Error('Failed to fetch posts');
    }
  },

  // Get single post
  getPost: async (id: number): Promise<Post> => {
    try {
      const response = await apiClient.get<Post>(`posts/${id}/`);
      return response.data;
    } catch {
      throw new Error('Failed to fetch post');
    }
  },

  // Create post
  createPost: async (data: {
    content: string;
    image_url?: string;
    scope?: string;
    is_anonymous?: boolean;
  }): Promise<Post> => {
    try {
      const response = await apiClient.post<Post>('posts/', data);
      clearListCache();
      return response.data;
    } catch {
      throw new Error('Failed to create post');
    }
  },

  // Update post
  updatePost: async (id: number, data: Partial<Post>): Promise<Post> => {
    try {
      const response = await apiClient.patch<Post>(`posts/${id}/`, data);
      clearListCache();
      return response.data;
    } catch {
      throw new Error('Failed to update post');
    }
  },

  // Delete post
  deletePost: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`posts/${id}/`);
      clearListCache();
    } catch {
      throw new Error('Failed to delete post');
    }
  },

  // Like post
  likePost: async (id: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`posts/${id}/like/`);
      return response.data;
    } catch {
      throw new Error('Failed to like post');
    }
  },

  // Unlike post
  unlikePost: async (id: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`posts/${id}/unlike/`);
      return response.data;
    } catch {
      throw new Error('Failed to unlike post');
    }
  },
};

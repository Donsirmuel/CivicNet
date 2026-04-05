import apiClient from './apiClient';
import type{ Comment } from '../types';

export const commentsService = {
  // Get comments (with optional filtering)
  getComments: async (params?: {
    post_id?: number;
    issue_id?: number;
  }): Promise<Comment[]> => {
    try {
      const response = await apiClient.get<Comment[]>('/comments/', { params });
      return response.data;
    } catch {
      throw new Error('Failed to fetch comments');
    }
  },

  // Get single comment
  getComment: async (id: number): Promise<Comment> => {
    try {
      const response = await apiClient.get<Comment>(`/comments/${id}/`);
      return response.data;
    } catch {
      throw new Error('Failed to fetch comment');
    }
  },

  // Create comment
  createComment: async (data: {
    content: string;
    post_id?: number;
    issue_id?: number;
    parent?: number;
  }): Promise<Comment> => {
    try {
      const response = await apiClient.post<Comment>('/comments/', data);
      return response.data;
    } catch {
      throw new Error('Failed to create comment');
    }
  },

  // Update comment
  updateComment: async (id: number, data: Partial<Comment>): Promise<Comment> => {
    try {
      const response = await apiClient.patch<Comment>(`/comments/${id}/`, data);
      return response.data;
    } catch {
      throw new Error('Failed to update comment');
    }
  },

  // Delete comment
  deleteComment: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/comments/${id}/`);
    } catch {
      throw new Error('Failed to delete comment');
    }
  },

  // Get comments for post
  getPostComments: async (postId: number): Promise<Comment[]> => {
    try {
      const response = await apiClient.get<Comment[]>('/comments/', {
        params: { post_id: postId },
      });
      return response.data;
    } catch {
      throw new Error('Failed to fetch post comments');
    }
  },

  // Get comments for issue
  getIssueComments: async (issueId: number): Promise<Comment[]> => {
    try {
      const response = await apiClient.get<Comment[]>('/comments/', {
        params: { issue_id: issueId },
      });
      return response.data;
    } catch {
      throw new Error('Failed to fetch issue comments');
    }
  },
};

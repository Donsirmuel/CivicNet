import apiClient from './apiClient';
import type { Message } from '../types';

interface PaginatedResponse<T> {
  results?: T[];
}

function normalizeListResponse<T>(data: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

export const messagesService = {
  // All messages involving the current user (sent + received)
  getMessages: async (): Promise<Message[]> => {
    const response = await apiClient.get<Message[] | PaginatedResponse<Message>>('/messages/');
    return normalizeListResponse<Message>(response.data);
  },

  // Received messages only
  getInbox: async (): Promise<Message[]> => {
    const response = await apiClient.get<Message[] | PaginatedResponse<Message>>(
      '/messages/inbox/',
    );
    return normalizeListResponse<Message>(response.data);
  },

  // Sent messages only
  getSent: async (): Promise<Message[]> => {
    const response = await apiClient.get<Message[] | PaginatedResponse<Message>>(
      '/messages/sent/',
    );
    return normalizeListResponse<Message>(response.data);
  },

  // Send a message (backend expects receiver_id)
  sendMessage: async (receiverId: number, content: string): Promise<Message> => {
    const response = await apiClient.post<Message>('/messages/', {
      receiver_id: receiverId,
      content,
    });
    return response.data;
  },

  // Mark a received message as read
  markAsRead: async (id: number): Promise<void> => {
    await apiClient.post(`/messages/${id}/mark_as_read/`);
  },
};

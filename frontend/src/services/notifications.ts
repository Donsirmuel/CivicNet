import apiClient from './apiClient';
import type { Notification } from '../types';

interface PaginatedResponse<T> {
  results: T[];
}

function normalizeListResponse<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as PaginatedResponse<T>).results)) {
    return (data as PaginatedResponse<T>).results;
  }
  return [];
}

export const NOTIFICATIONS_CHANGED_EVENT = 'civic:notifications-changed';

function announceChange() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
}

export const notificationsService = {
  // All notifications for the signed-in user, newest first.
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[] | PaginatedResponse<Notification>>(
      '/notifications/',
    );
    return normalizeListResponse(response.data);
  },

  // How many are still unread (for the sidebar dot).
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<Notification[] | PaginatedResponse<Notification>>(
      '/notifications/unread/',
    );
    return normalizeListResponse(response.data).length;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.post(`/notifications/${id}/mark_as_read/`);
    announceChange();
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark_all_as_read/');
    announceChange();
  },
};

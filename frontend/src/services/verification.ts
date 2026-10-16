import apiClient from './apiClient';

export interface VerificationRequest {
  id: number;
  office_name: string;
  jurisdiction: 'ward' | 'lga' | 'state';
  state?: string | null;
  lga?: string | null;
  ward?: string | null;
  document_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface CreateVerificationRequestData {
  office_name: string;
  jurisdiction: 'ward' | 'lga' | 'state';
  state?: string;
  lga?: string;
  ward?: string;
  document_url?: string;
}

export const verificationService = {
  // Requests belonging to the current user (backend scopes non-staff).
  listMyRequests: async (): Promise<VerificationRequest[]> => {
    try {
      const response = await apiClient.get<VerificationRequest[]>('/verification-requests/');
      return response.data;
    } catch {
      throw new Error('Failed to fetch verification requests');
    }
  },

  createRequest: async (data: CreateVerificationRequestData): Promise<VerificationRequest> => {
    try {
      const response = await apiClient.post<VerificationRequest>('/verification-requests/', data);
      return response.data;
    } catch {
      throw new Error('Failed to submit verification request');
    }
  },

  // Staff-only: approve or reject a request.
  reviewRequest: async (id: number, approve: boolean): Promise<{ status: string; id: number }> => {
    try {
      const response = await apiClient.post<{ status: string; id: number }>(
        `/verification-requests/${id}/review/`,
        { approve },
      );
      return response.data;
    } catch {
      throw new Error('Failed to review verification request');
    }
  },

  requestPasswordReset: async (email: string): Promise<string> => {
    try {
      const response = await apiClient.post<{ detail: string }>('/auth/password-reset/', {
        email,
      });
      return response.data.detail;
    } catch {
      throw new Error('Failed to request password reset');
    }
  },

  confirmPasswordReset: async (data: {
    uid: string;
    token: string;
    new_password: string;
  }): Promise<string> => {
    try {
      const response = await apiClient.post<{ detail: string }>(
        '/auth/password-reset/confirm/',
        data,
      );
      return response.data.detail;
    } catch (error: unknown) {
      const detail =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Password reset failed';
      throw new Error(detail);
    }
  },
};

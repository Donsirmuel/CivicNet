import apiClient from './apiClient';
import type { Issue, StatusHistory } from '../types';

interface PaginatedResponse<T> {
  results?: T[];
}

type ActionResponse = Record<string, unknown>;

function normalizeListResponse<T>(data: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

const LIST_CACHE_TTL_MS = 4000;
const listCache = new Map<string, { timestamp: number; data: Issue[] }>();
const listInFlight = new Map<string, Promise<Issue[]>>();

function serializeParams(params?: {
  status?: string;
  category?: string;
  state?: string;
  scope?: string;
  ordering?: string;
  search?: string;
}) {
  const normalized = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(normalized);
}

function clearListCache() {
  listCache.clear();
  listInFlight.clear();
}

export const issuesService = {
  // Get all issues
  getIssues: async (params?: {
    status?: string;
    category?: string;
    state?: string;
    scope?: string;
    ordering?: string;
    search?: string;
  }) => {
    const key = serializeParams(params);
    const cached = listCache.get(key);
    if (cached && Date.now() - cached.timestamp < LIST_CACHE_TTL_MS) {
      return cached.data;
    }

    const inFlight = listInFlight.get(key);
    if (inFlight) return inFlight;

    const request = (async () => {
      try {
        const response = await apiClient.get<Issue[] | PaginatedResponse<Issue>>('issues/', { params });
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
      throw new Error('Failed to fetch issues');
    }
  },

  // Get single issue
  getIssue: async (id: number): Promise<Issue> => {
    try {
      const response = await apiClient.get<Issue>(`issues/${id}/`);
      return response.data;
    } catch {
      throw new Error('Failed to fetch issue');
    }
  },

  // Create issue
  createIssue: async (data: {
    title: string;
    description: string;
    category: string;
    state: string;
    lga: string;
    ward: string;
    scope: string;
    priority?: string;
    image_url?: string;
  }): Promise<Issue> => {
    try {
      const response = await apiClient.post<Issue>('issues/', data);
      clearListCache();
      return response.data;
    } catch {
      throw new Error('Failed to create issue');
    }
  },

  // Update issue
  updateIssue: async (id: number, data: Partial<Issue>): Promise<Issue> => {
    try {
      const response = await apiClient.patch<Issue>(`issues/${id}/`, data);
      clearListCache();
      return response.data;
    } catch {
      throw new Error('Failed to update issue');
    }
  },

  // Update issue status
  updateIssueStatus: async (id: number, status: string, note?: string): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`issues/${id}/update_status/`, {
        status,
        note,
      });
      clearListCache();
      return response.data;
    } catch {
      throw new Error('Failed to update issue status');
    }
  },

  // Like issue
  likeIssue: async (id: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`issues/${id}/like/`);
      return response.data;
    } catch {
      throw new Error('Failed to like issue');
    }
  },

  // Unlike issue
  unlikeIssue: async (id: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`issues/${id}/unlike/`);
      return response.data;
    } catch {
      throw new Error('Failed to unlike issue');
    }
  },

  // Upvote issue
  upvoteIssue: async (id: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`issues/${id}/upvote/`);
      return response.data;
    } catch {
      throw new Error('Failed to upvote issue');
    }
  },

  // Downvote issue
  downvoteIssue: async (id: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`issues/${id}/downvote/`);
      return response.data;
    } catch {
      throw new Error('Failed to downvote issue');
    }
  },

  // Assign issue
  assignIssue: async (id: number, assignedToId: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`issues/${id}/assign/`, {
        assigned_to_id: assignedToId,
      });
      clearListCache();
      return response.data;
    } catch {
      throw new Error('Failed to assign issue');
    }
  },

  // Assign issue to me
  assignIssueToMe: async (id: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`issues/${id}/assign_to_me/`);
      clearListCache();
      return response.data;
    } catch {
      throw new Error('Failed to assign issue to you');
    }
  },

  // Get dashboard issues (for officials)
  getDashboardIssues: async (params?: {
    status?: string;
    category?: string;
  }): Promise<Issue[]> => {
    try {
      const response = await apiClient.get<Issue[] | PaginatedResponse<Issue>>('issues/dashboard/', { params });
      return normalizeListResponse(response.data);
    } catch {
      throw new Error('Failed to fetch dashboard issues');
    }
  },

  // Get status history for issue
  getStatusHistory: async (issueId: number): Promise<StatusHistory[]> => {
    try {
      const response = await apiClient.get<StatusHistory[] | PaginatedResponse<StatusHistory>>('status-history/', {
        params: { issue_id: issueId },
      });
      return normalizeListResponse(response.data);
    } catch {
      throw new Error('Failed to fetch status history');
    }
  },

  // Escalate issue to the next scope level
  escalateIssue: async (id: number): Promise<ActionResponse> => {
    try {
      const response = await apiClient.post<ActionResponse>(`issues/${id}/escalate/`);
      clearListCache();
      return response.data;
    } catch {
      throw new Error('Failed to escalate issue');
    }
  },
};

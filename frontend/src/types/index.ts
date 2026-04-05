// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  role?: string;
  jurisdiction?: string;
  bio?: string;
  location?: string;
  phone?: string;
  phone_number?: string;
  avatar?: string;
  profile_picture?: string;
  banner?: string;
  cover_image?: string;
  banner_image?: string;
  date_joined?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: number;
  user: User;
  bio?: string;
  avatar_url?: string;
  location?: string;
  role: 'citizen' | 'official';
  is_verified: boolean;
  state?: string;
  lga?: string;
  ward?: string;
  jurisdiction_type?: 'ward' | 'lga' | 'state';
  created_at: string;
  updated_at: string;
}

// Issue types
export type IssueStatus = 'reported' | 'under_review' | 'in_progress' | 'resolved' | 'closed';
export type IssueCategory = 'infrastructure' | 'safety' | 'health' | 'environment' | 'education' | 'transportation' | 'utilities' | 'other';
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface StatusHistory {
  id: number;
  status: IssueStatus;
  updated_by: User;
  note?: string;
  created_at: string;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  scope: 'local' | 'state' | 'national';
  priority: IssuePriority;
  state: string;
  lga: string;
  ward: string;
  created_by: User;
  assigned_to?: User;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  image_url?: string;
  comments_list?: Comment[];
  status_history?: StatusHistory[];
  created_at: string;
  updated_at: string;
}

// Post types
export interface Post {
  id: number;
  content: string;
  author: User;
  likes: number;
  comments: number;
  shares: number;
  image_url?: string;
  is_pinned: boolean;
  comments_list?: Comment[];
  created_at: string;
  updated_at: string;
}

// Comment types
export interface Comment {
  id: number;
  content: string;
  author: User;
  likes: number;
  parent?: number;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

// Message types
export interface Message {
  id: number;
  sender: User;
  receiver: User;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Notification types
export interface Notification {
  id: number;
  user: User;
  notification_type: string;
  title: string;
  message: string;
  actor?: User;
  post?: number;
  issue?: number;
  is_read: boolean;
  created_at: string;
}

// Official Jurisdiction types
export interface OfficialJurisdiction {
  id: number;
  official: User;
  state: string;
  lga: string;
  ward: string;
  jurisdiction_level: 'ward' | 'lga' | 'state';
  created_at: string;
  updated_at: string;
}

// Metrics types
export interface OfficialMetrics {
  totalAssigned: number;
  reported: number;
  underReview: number;
  inProgress: number;
  resolved: number;
  closed: number;
  resolutionRate: number;
  avgResponseTime?: string;
  categoryBreakdown: Record<string, number>;
}

// Auth types
export interface AuthResponse {
  token: string;
  user: User;
}

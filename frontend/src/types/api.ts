// ── API-specific types ──

import type { User, OAuthAccount } from './models';

/** Custom API error with status code and response data. */
export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(message: string, status: number, data: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Parameters for the /users/directory endpoint. */
export interface DirectoryParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  country?: string;
  gender?: string;
  activity_status?: string;
  org_type?: string;
  platform?: string;
  has_traits?: string;
  [key: string]: string | number | undefined;
}

/** Response from the /users/directory endpoint. */
export interface DirectoryResponse {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  facets?: Record<string, Record<string, number>>;
}

/** Options for getNotifications. */
export interface NotificationOptions {
  unreadOnly?: boolean;
  limit?: number;
}

/** Response from /notifications/unread-count. */
export interface UnreadCountResponse {
  count: number;
}

/** Response from /admin/request-counts. */
export interface AdminCountsResponse {
  fictional_species_requests: number;
  breed_requests: number;
  name_reports: number;
  reports: number;
  pending_reviews: number;
  [key: string]: number;
}

/** Auth callback request body. */
export interface AuthCallbackBody {
  display_name: string;
  avatar_url?: string | null;
  link_token?: string;
  login_provider?: string;
  yt_avatar?: boolean;
  [key: string]: unknown;
}

/** Response from /reports/:id/blacklist-preview. */
export interface BlacklistPreviewResponse {
  accounts: OAuthAccount[];
  identifiers: Array<{ type: string; value: string }>;
}

/** Response from /live-status. */
export interface LiveStatusResponse {
  live: Array<{
    user_id: string;
    provider: string;
    stream_title?: string;
    stream_url?: string;
    started_at?: string;
    is_primary?: boolean;
  }>;
  primaries?: Record<string, { real?: string; fictional?: string }>;
}

import { supabase } from './supabase';
import { ApiError } from '../types/api';
import type { SpeciesCache, User, OAuthAccount, VtuberTrait, FictionalSpecies, Breed, Notification, UserReport, BreedRequest, FictionalSpeciesRequest, NameReport, BlacklistEntry } from '../types/models';
import type { TreeEntry } from '../types/tree';
import type { DirectoryResponse, NotificationOptions, UnreadCountResponse, AdminCountsResponse, AuthCallbackBody, BlacklistPreviewResponse, LiveStatusResponse } from '../types/api';
import type { NotificationGroup } from '../types/models';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...await getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || `API error ${res.status}`, res.status, data);
  }
  return data as T;
}

// Bounded session cache — evicts oldest entry when exceeding max size
const MAX_CACHE = 100;
function boundedSet<K, V>(map: Map<K, V>, key: K, value: V): void {
  if (map.size >= MAX_CACHE) {
    const first = map.keys().next().value!;
    map.delete(first);
  }
  map.set(key, value);
}

// Session-level cache for species search (cleared on page refresh)
const searchCache = new Map<string, SpeciesCache[]>();
const childrenCache = new Map<number, { results: SpeciesCache[] } | SpeciesCache[]>();

// Session-level cache for taxonomy trees
const treeCache = new Map<string, TreeEntry[]>();

export const api = {
  // Auth
  authCallback: (body: AuthCallbackBody) => apiFetch<User>('/auth/callback', {
    method: 'POST', body: JSON.stringify(body),
  }),
  createLinkToken: () => apiFetch<{ token: string }>('/auth/link-token', { method: 'POST' }),

  // Users
  getMe: () => apiFetch<User>('/users/me'),
  updateMe: (body: Partial<User>) => apiFetch<User>('/users/me', {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  getUser: (id: string) => apiFetch<User>(`/users/${id}`),

  // OAuth Accounts
  getMyOAuthAccounts: () => apiFetch<OAuthAccount[]>('/users/me/oauth-accounts'),
  syncOAuthAccounts: (body: Record<string, unknown>) => apiFetch<OAuthAccount[]>('/users/me/oauth-accounts/sync', {
    method: 'POST', body: JSON.stringify(body),
  }),
  updateOAuthAccount: (id: string, body: Partial<OAuthAccount>) => apiFetch<OAuthAccount>(`/users/me/oauth-accounts/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  deleteOAuthAccount: (id: string) => apiFetch<{ ok: boolean }>(`/users/me/oauth-accounts/${id}`, {
    method: 'DELETE',
  }),
  refreshOAuthAccount: (id: string) => apiFetch<OAuthAccount>(`/users/me/oauth-accounts/${id}/refresh`, {
    method: 'POST',
  }),
  resubscribe: (accountId: string) => apiFetch<{ ok: boolean }>('/users/me/resubscribe', {
    method: 'POST', body: JSON.stringify({ account_id: accountId }),
  }),

  // Species
  searchSpecies: async (q: string): Promise<SpeciesCache[]> => {
    const key = q.trim().toLowerCase();
    if (searchCache.has(key)) return searchCache.get(key)!;
    const data = await apiFetch<SpeciesCache[]>(`/species/search?q=${encodeURIComponent(q)}`);
    boundedSet(searchCache, key, data);
    return data;
  },
  searchSpeciesStream: async (q: string, onResult: (sp: SpeciesCache) => void, { signal }: { signal?: AbortSignal } = {}): Promise<void> => {
    const key = q.trim().toLowerCase();
    if (searchCache.has(key)) {
      const cached = searchCache.get(key)!;
      for (const sp of cached) {
        if (signal?.aborted) return;
        onResult(sp);
      }
      return;
    }
    const headers = { ...await getAuthHeaders() };
    const res = await fetch(`/api/species/search/stream?q=${encodeURIComponent(q)}`, { headers, signal });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `API error ${res.status}`);
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const all: SpeciesCache[] = [];
    try {
      while (true) {
        if (signal?.aborted) { reader.cancel(); return; }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        for (const line of lines) {
          if (line.trim()) {
            const sp = JSON.parse(line) as SpeciesCache & { error?: string };
            if (sp.error) throw new Error(sp.error);
            all.push(sp);
            if (signal?.aborted) { reader.cancel(); return; }
            onResult(sp);
          }
        }
      }
    } catch (err) {
      reader.cancel();
      throw err;
    }
    if (buffer.trim()) {
      const sp = JSON.parse(buffer) as SpeciesCache & { error?: string };
      if (sp.error) throw new Error(sp.error);
      all.push(sp);
      if (!signal?.aborted) onResult(sp);
    }
    if (!signal?.aborted) boundedSet(searchCache, key, all);
  },
  matchSpecies: (name: string) => apiFetch<SpeciesCache>(`/species/match?name=${encodeURIComponent(name)}`),
  getSpecies: (id: number) => apiFetch<SpeciesCache>(`/species/${id}`),
  getSubspecies: async (taxonId: number): Promise<{ results: SpeciesCache[] } | SpeciesCache[]> => {
    if (childrenCache.has(taxonId)) return childrenCache.get(taxonId)!;
    const data = await apiFetch<{ results: SpeciesCache[] } | SpeciesCache[]>(`/species/${taxonId}/children`);
    boundedSet(childrenCache, taxonId, data);
    return data;
  },
  getSubspeciesStream: async (taxonId: number, onResult: (sp: SpeciesCache) => void, { signal }: { signal?: AbortSignal } = {}): Promise<void> => {
    if (childrenCache.has(taxonId)) {
      const cached = childrenCache.get(taxonId)!;
      const items = (cached as { results?: SpeciesCache[] }).results || (cached as SpeciesCache[]);
      for (const sp of items) {
        if (signal?.aborted) return;
        onResult(sp);
      }
      return;
    }
    const headers = { ...await getAuthHeaders() };
    const res = await fetch(`/api/species/${taxonId}/children/stream`, { headers, signal });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `API error ${res.status}`);
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const all: SpeciesCache[] = [];
    try {
      while (true) {
        if (signal?.aborted) { reader.cancel(); return; }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        for (const line of lines) {
          if (line.trim()) {
            const sp = JSON.parse(line) as SpeciesCache & { error?: string };
            if (sp.error) throw new Error(sp.error);
            all.push(sp);
            if (signal?.aborted) { reader.cancel(); return; }
            onResult(sp);
          }
        }
      }
    } catch (err) {
      reader.cancel();
      throw err;
    }
    if (buffer.trim()) {
      const sp = JSON.parse(buffer) as SpeciesCache & { error?: string };
      if (sp.error) throw new Error(sp.error);
      all.push(sp);
      if (!signal?.aborted) onResult(sp);
    }
    if (!signal?.aborted) boundedSet(childrenCache, taxonId, { results: all });
  },

  // Breeds
  getBreeds: (taxonId: number) => apiFetch<Breed[]>(`/breeds?taxon_id=${taxonId}`),
  searchBreeds: (q: string) => apiFetch<Breed[]>(`/breeds/search?q=${encodeURIComponent(q)}`),
  createBreedRequest: (body: Partial<BreedRequest>) => apiFetch<BreedRequest>('/breeds/requests', {
    method: 'POST', body: JSON.stringify(body),
  }),
  createNameReport: (body: Partial<NameReport>) => apiFetch<NameReport>('/species/name-reports', {
    method: 'POST', body: JSON.stringify(body),
  }),
  getNameReports: (status = 'pending') =>
    apiFetch<NameReport[]>(`/species/name-reports?status=${encodeURIComponent(status)}`),
  updateNameReport: (id: number, body: Partial<NameReport>) => apiFetch<NameReport>(`/species/name-reports/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),

  // Admin: Breed Requests
  getBreedRequests: (status = 'pending') =>
    apiFetch<BreedRequest[]>(`/breeds/requests?status=${encodeURIComponent(status)}`),
  updateBreedRequest: (id: number, body: Partial<BreedRequest>) => apiFetch<BreedRequest>(`/breeds/requests/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),

  // Traits
  getTraits: (userId: string) =>
    apiFetch<{ traits: VtuberTrait[] }>(`/traits?user_id=${userId}`).then(d => d.traits),
  createTrait: (body: Partial<VtuberTrait>) => apiFetch<VtuberTrait>('/traits', {
    method: 'POST', body: JSON.stringify(body),
  }).then(r => { window.dispatchEvent(new CustomEvent('vtaxon:traits-changed')); return r; }),
  updateTrait: (id: string, body: Partial<VtuberTrait>) => apiFetch<VtuberTrait>(`/traits/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  deleteTrait: (id: string) => apiFetch<{ ok: boolean }>(`/traits/${id}`, { method: 'DELETE' })
    .then(r => { window.dispatchEvent(new CustomEvent('vtaxon:traits-changed')); return r; }),

  // Taxonomy (session-cached)
  getTaxonomyTree: async (qs = ''): Promise<{ entries: TreeEntry[] }> => {
    const key = 'real' + qs;
    if (treeCache.has(key)) return { entries: treeCache.get(key)! };
    const data = await apiFetch<{ entries: TreeEntry[] }>(`/taxonomy/tree${qs}`);
    boundedSet(treeCache, key, data.entries);
    return data;
  },
  getFictionalTree: async (qs = ''): Promise<{ entries: TreeEntry[] }> => {
    const key = 'fictional' + qs;
    if (treeCache.has(key)) return { entries: treeCache.get(key)! };
    const data = await apiFetch<{ entries: TreeEntry[] }>(`/taxonomy/fictional-tree${qs}`);
    boundedSet(treeCache, key, data.entries);
    return data;
  },
  clearTreeCache: (): void => { treeCache.clear(); },

  // Fictional Species
  getFictionalSpecies: () => apiFetch<FictionalSpecies[]>('/fictional-species'),
  createFictionalRequest: (body: Partial<FictionalSpeciesRequest>) => apiFetch<FictionalSpeciesRequest>('/fictional-species/requests', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Admin: Fictional Species Requests
  getRequests: (status = 'pending') =>
    apiFetch<FictionalSpeciesRequest[]>(`/fictional-species/requests?status=${encodeURIComponent(status)}`),
  updateRequest: (id: number, body: Partial<FictionalSpeciesRequest>) => apiFetch<FictionalSpeciesRequest>(`/fictional-species/requests/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),

  // Recent users (for welcome toast)
  getRecentUsers: (since?: string): Promise<User[]> => {
    const qs = since ? `?since=${encodeURIComponent(since)}&limit=10` : '';
    return apiFetch<User[]>(`/users/recent${qs}`);
  },

  // Directory
  getDirectory: (params: Record<string, string | number | undefined | null> = {}): Promise<DirectoryResponse> => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    }
    const q = qs.toString();
    return apiFetch<DirectoryResponse>(`/users/directory${q ? '?' + q : ''}`);
  },

  // Appeal (user)
  submitAppeal: (body: { appeal_note: string }) => apiFetch<{ ok: boolean }>('/users/me/appeal', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Reports (public / anonymous)
  createReport: (body: Partial<UserReport>) => apiFetch<UserReport>('/reports', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Notifications
  getNotifications: (options: NotificationOptions = {}): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (options.unreadOnly) params.set('unread_only', 'true');
    if (options.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    return apiFetch<Notification[]>(`/notifications${qs ? '?' + qs : ''}`);
  },
  getNotificationsGrouped: (type?: string): Promise<NotificationGroup[]> => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiFetch<NotificationGroup[]>(`/notifications/grouped${qs}`);
  },
  getUnreadCount: () => apiFetch<UnreadCountResponse>('/notifications/unread-count'),
  markNotificationsRead: (body: { ids?: number[]; all?: boolean }) => apiFetch<{ ok: boolean }>('/notifications/read', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Admin counts
  getAdminCounts: () => apiFetch<AdminCountsResponse>('/admin/request-counts'),

  // Admin export
  exportFictionalRequests: () => apiFetch<FictionalSpeciesRequest[]>('/admin/export-fictional'),
  exportBreedRequests: () => apiFetch<BreedRequest[]>('/admin/export-breeds'),
  transitionFictionalRequests: () => apiFetch<{ ok: boolean }>('/admin/transition-fictional', { method: 'POST' }),
  transitionBreedRequests: () => apiFetch<{ ok: boolean }>('/admin/transition-breeds', { method: 'POST' }),

  // Reports (admin)
  getReports: (status = 'pending') =>
    apiFetch<UserReport[]>(`/reports?status=${encodeURIComponent(status)}`),
  updateReport: (id: number, body: Partial<UserReport>) => apiFetch<UserReport>(`/reports/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  hideReportedUser: (reportId: number, body: { visibility: string; reason?: string }) => apiFetch<{ ok: boolean }>(`/reports/${reportId}/hide`, {
    method: 'POST', body: JSON.stringify(body),
  }),
  getBlacklistPreview: (reportId: number) =>
    apiFetch<BlacklistPreviewResponse>(`/reports/${reportId}/blacklist-preview`),
  banUser: (reportId: number, body: { reason?: string }) => apiFetch<{ ok: boolean }>(`/reports/${reportId}/ban`, {
    method: 'POST', body: JSON.stringify(body),
  }),
  getBlacklist: () => apiFetch<BlacklistEntry[]>('/reports/blacklist'),
  deleteBlacklistEntry: (id: number) => apiFetch<{ ok: boolean }>(`/reports/blacklist/${id}`, {
    method: 'DELETE',
  }),

  // Admin: User visibility
  setUserVisibility: (userId: string, body: { visibility: string; reason?: string }) => apiFetch<{ ok: boolean }>(`/admin/users/${userId}/visibility`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  getPendingReviews: () => apiFetch<User[]>('/admin/users/pending-reviews'),

  // Live status (no session cache — always fresh)
  getLiveStatus: () => apiFetch<LiveStatusResponse>('/live-status'),
};

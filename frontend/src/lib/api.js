import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...await getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || `API error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Session-level cache for species search (cleared on page refresh)
const searchCache = new Map();
const childrenCache = new Map();

export const api = {
  // Auth
  authCallback: (body) => apiFetch('/auth/callback', {
    method: 'POST', body: JSON.stringify(body),
  }),
  createLinkToken: () => apiFetch('/auth/link-token', { method: 'POST' }),

  // Users
  getMe: () => apiFetch('/users/me'),
  updateMe: (body) => apiFetch('/users/me', {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  getUser: (id) => apiFetch(`/users/${id}`),

  // OAuth Accounts
  getMyOAuthAccounts: () => apiFetch('/users/me/oauth-accounts'),
  syncOAuthAccounts: (body) => apiFetch('/users/me/oauth-accounts/sync', {
    method: 'POST', body: JSON.stringify(body),
  }),
  updateOAuthAccount: (id, body) => apiFetch(`/users/me/oauth-accounts/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  deleteOAuthAccount: (id) => apiFetch(`/users/me/oauth-accounts/${id}`, {
    method: 'DELETE',
  }),
  refreshOAuthAccount: (id) => apiFetch(`/users/me/oauth-accounts/${id}/refresh`, {
    method: 'POST',
  }),

  // Species
  searchSpecies: async (q) => {
    const key = q.trim().toLowerCase();
    if (searchCache.has(key)) return searchCache.get(key);
    const data = await apiFetch(`/species/search?q=${encodeURIComponent(q)}`);
    searchCache.set(key, data);
    return data;
  },
  searchSpeciesStream: async (q, onResult) => {
    const key = q.trim().toLowerCase();
    if (searchCache.has(key)) {
      const cached = searchCache.get(key);
      for (const sp of cached) onResult(sp);
      return;
    }
    const headers = { ...await getAuthHeaders() };
    const res = await fetch(`/api/species/search/stream?q=${encodeURIComponent(q)}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `API error ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const all = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) {
          const sp = JSON.parse(line);
          if (sp.error) throw new Error(sp.error);
          all.push(sp);
          onResult(sp);
        }
      }
    }
    if (buffer.trim()) {
      const sp = JSON.parse(buffer);
      if (sp.error) throw new Error(sp.error);
      all.push(sp);
      onResult(sp);
    }
    searchCache.set(key, all);
  },
  matchSpecies: (name) => apiFetch(`/species/match?name=${encodeURIComponent(name)}`),
  getSpecies: (id) => apiFetch(`/species/${id}`),
  getSubspecies: async (taxonId) => {
    if (childrenCache.has(taxonId)) return childrenCache.get(taxonId);
    const data = await apiFetch(`/species/${taxonId}/children`);
    childrenCache.set(taxonId, data);
    return data;
  },
  getSubspeciesStream: async (taxonId, onResult) => {
    if (childrenCache.has(taxonId)) {
      const cached = childrenCache.get(taxonId);
      for (const sp of (cached.results || cached)) onResult(sp);
      return;
    }
    const headers = { ...await getAuthHeaders() };
    const res = await fetch(`/api/species/${taxonId}/children/stream`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `API error ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const all = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) {
          const sp = JSON.parse(line);
          if (sp.error) throw new Error(sp.error);
          all.push(sp);
          onResult(sp);
        }
      }
    }
    if (buffer.trim()) {
      const sp = JSON.parse(buffer);
      if (sp.error) throw new Error(sp.error);
      all.push(sp);
      onResult(sp);
    }
    childrenCache.set(taxonId, { results: all });
  },

  // Breeds
  getBreedCategories: (() => {
    let cached = null;
    return async () => {
      if (cached) return cached;
      const data = await apiFetch('/breeds/categories');
      cached = data;
      return data;
    };
  })(),
  getBreeds: (taxonId) => apiFetch(`/breeds?taxon_id=${taxonId}`),
  searchBreeds: (q) => apiFetch(`/breeds/search?q=${encodeURIComponent(q)}`),
  createBreedRequest: (body) => apiFetch('/breeds/requests', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Admin: Breed Requests
  getBreedRequests: (status = 'pending') =>
    apiFetch(`/breeds/requests?status=${encodeURIComponent(status)}`),
  updateBreedRequest: (id, body) => apiFetch(`/breeds/requests/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),

  // Traits
  getTraits: (userId) => apiFetch(`/traits?user_id=${userId}`),
  createTrait: (body) => apiFetch('/traits', {
    method: 'POST', body: JSON.stringify(body),
  }),
  updateTrait: (id, body) => apiFetch(`/traits/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  deleteTrait: (id) => apiFetch(`/traits/${id}`, { method: 'DELETE' }),

  // Taxonomy
  getTaxonomyTree: (qs = '') => apiFetch(`/taxonomy/tree${qs}`),
  getFictionalTree: (qs = '') => apiFetch(`/taxonomy/fictional-tree${qs}`),

  // Fictional Species
  getFictionalSpecies: () => apiFetch('/fictional-species'),
  createFictionalRequest: (body) => apiFetch('/fictional-species/requests', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Admin: Fictional Species Requests
  getRequests: (status = 'pending') =>
    apiFetch(`/fictional-species/requests?status=${encodeURIComponent(status)}`),
  updateRequest: (id, body) => apiFetch(`/fictional-species/requests/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),

  // Recent users (for welcome toast)
  getRecentUsers: (since) => {
    const qs = since ? `?since=${encodeURIComponent(since)}&limit=10` : '';
    return apiFetch(`/users/recent${qs}`);
  },

  // Directory
  getDirectory: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    }
    const q = qs.toString();
    return apiFetch(`/users/directory${q ? '?' + q : ''}`);
  },

  // Reports (public / anonymous)
  createReport: (body) => apiFetch('/reports', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Notifications
  getNotifications: (options = {}) => {
    const params = new URLSearchParams();
    if (options.unreadOnly) params.set('unread_only', 'true');
    if (options.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    return apiFetch(`/notifications${qs ? '?' + qs : ''}`);
  },
  getNotificationsGrouped: (type) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiFetch(`/notifications/grouped${qs}`);
  },
  getUnreadCount: () => apiFetch('/notifications/unread-count'),
  markNotificationsRead: (body) => apiFetch('/notifications/read', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Admin counts
  getAdminCounts: () => apiFetch('/admin/request-counts'),

  // Admin export
  exportFictionalRequests: () => apiFetch('/admin/export-fictional'),
  exportBreedRequests: () => apiFetch('/admin/export-breeds'),
  transitionFictionalRequests: () => apiFetch('/admin/transition-fictional', { method: 'POST' }),
  transitionBreedRequests: () => apiFetch('/admin/transition-breeds', { method: 'POST' }),

  // Reports (admin)
  getReports: (status = 'pending') =>
    apiFetch(`/reports?status=${encodeURIComponent(status)}`),
  updateReport: (id, body) => apiFetch(`/reports/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  getBlacklistPreview: (reportId) =>
    apiFetch(`/reports/${reportId}/blacklist-preview`),
  banUser: (reportId, body) => apiFetch(`/reports/${reportId}/ban`, {
    method: 'POST', body: JSON.stringify(body),
  }),
  getBlacklist: () => apiFetch('/reports/blacklist'),
  deleteBlacklistEntry: (id) => apiFetch(`/reports/blacklist/${id}`, {
    method: 'DELETE',
  }),

};

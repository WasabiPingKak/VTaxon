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
    throw new Error(data.error || `API error ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  authCallback: (body) => apiFetch('/auth/callback', {
    method: 'POST', body: JSON.stringify(body),
  }),

  // Users
  getMe: () => apiFetch('/users/me'),
  updateMe: (body) => apiFetch('/users/me', {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  getUser: (id) => apiFetch(`/users/${id}`),

  // Species
  searchSpecies: (q) => apiFetch(`/species/search?q=${encodeURIComponent(q)}`),
  getSpecies: (id) => apiFetch(`/species/${id}`),

  // Traits
  getTraits: (userId) => apiFetch(`/traits?user_id=${userId}`),
  createTrait: (body) => apiFetch('/traits', {
    method: 'POST', body: JSON.stringify(body),
  }),
  deleteTrait: (id) => apiFetch(`/traits/${id}`, { method: 'DELETE' }),

  // Kinship
  getKinship: (userId, includeHuman = false) =>
    apiFetch(`/kinship/${userId}?include_human=${includeHuman}`),
};

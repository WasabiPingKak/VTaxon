// ── Domain entity types matching backend schema ──

export type Provider = 'youtube' | 'twitch';
export type Role = 'admin' | 'user';
export type Visibility = 'visible' | 'hidden' | 'pending_review';
export type ActivityStatus = 'active' | 'hiatus' | 'preparing' | string;
export type OrgType = 'corporate' | 'indie' | 'club';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'duplicate' | 'existing';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: Role;
  organization: string | null;
  bio: string | null;
  country_flags: string[];
  social_links: Record<string, string>;
  primary_platform: Provider | null;
  profile_data: Record<string, unknown>;
  visibility: Visibility;
  visibility_reason: string | null;
  visibility_changed_at: string | null;
  visibility_changed_by: string | null;
  vtuber_declaration_at: string | null;
  appeal_note: string | null;
  gender?: string;
  activity_status?: ActivityStatus;
  org_type?: OrgType;
  platforms?: string[];
  debut_date?: string | null;
  blood_type?: string | null;
  mbti?: string | null;
  birthday_month?: number | null;
  birthday_day?: number | null;
  mama?: Array<{ name: string; url?: string }> | string[];
  papa?: Array<{ name: string; url?: string }> | string[];
  created_at: string;
  updated_at: string;
}

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: Provider;
  provider_account_id: string;
  provider_display_name: string;
  provider_avatar_url: string | null;
  channel_url: string | null;
  show_on_profile: boolean;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string | null;
  created_at: string;
}

export interface SpeciesCache {
  taxon_id: number;
  scientific_name: string;
  canonical_name?: string;
  common_name_en: string | null;
  common_name_zh: string | null;
  display_name_override?: string | null;
  alternative_names_zh?: string[] | null;
  taxon_rank: string;
  taxon_path: string;
  kingdom: string | null;
  phylum: string | null;
  class_: string | null;
  order_: string | null;
  family: string | null;
  genus: string | null;
  path_zh: Record<string, string>;
  cached_at: string;
}

export interface FictionalSpecies {
  id: number;
  name: string;
  name_zh: string | null;
  origin: string;
  sub_origin: string | null;
  category_path: string;
  description: string | null;
  created_at: string;
}

export interface VtuberTrait {
  id: string;
  user_id: string;
  taxon_id: number | null;
  fictional_species_id: number | null;
  display_name?: string;
  breed_name: string | null;
  breed_id: number | null;
  trait_note: string | null;
  species?: SpeciesCache;
  fictional_species?: FictionalSpecies;
  created_at: string;
  updated_at: string;
}

export interface Breed {
  id: number;
  taxon_id: number;
  name_en: string;
  name_zh: string | null;
  breed_group: string | null;
  wikidata_id: string | null;
  source: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  metadata?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface NotificationGroup {
  type: string;
  count: number;
  latest: Notification;
  items?: Notification[];
}

export interface UserReport {
  id: number;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  evidence_url: string | null;
  report_type: string;
  status: ReportStatus;
  admin_note: string | null;
  reporter?: User;
  reported_user?: User;
  created_at: string;
}

export interface BreedRequest {
  id: number;
  user_id: string;
  taxon_id: number;
  name_zh: string | null;
  name_en: string | null;
  description: string | null;
  status: RequestStatus;
  admin_note: string | null;
  user?: User;
  species?: SpeciesCache;
  created_at: string;
}

export interface FictionalSpeciesRequest {
  id: number;
  user_id: string;
  name_zh: string | null;
  name_en: string | null;
  suggested_origin: string | null;
  suggested_sub_origin: string | null;
  description: string | null;
  status: RequestStatus;
  admin_note: string | null;
  user?: User;
  created_at: string;
}

export interface NameReport {
  id: number;
  user_id: string;
  taxon_id: number;
  reported_name: string;
  suggested_name: string;
  reason: string | null;
  status: RequestStatus;
  admin_note: string | null;
  user?: User;
  species?: SpeciesCache;
  created_at: string;
}

export interface BlacklistEntry {
  id: number;
  identifier_type: string;
  identifier_value: string;
  user_id: string | null;
  reason: string | null;
  banned_by: string | null;
  user?: User;
  created_at: string;
}

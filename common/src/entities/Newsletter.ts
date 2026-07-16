import type { Identifiable } from './Identifiable.js';

export interface Newsletter extends Identifiable {
  name: string;
  description: string | null;
  replyTo: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface NewsletterCreateData {
  name: string;
  description?: string | null;
  replyTo?: string | null;
}

export interface NewsletterUpdateData {
  name?: string;
  description?: string | null;
  replyTo?: string | null;
}

export interface NewsletterQuery {
  view?: 'all' | 'assigned';

  cursor?: string;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortType?: 'asc' | 'desc';
  name?: string;
}

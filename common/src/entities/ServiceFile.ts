import type { Identifiable } from './Identifiable.js';

export interface ServiceFile extends Identifiable {
  name: string;
  field: string | null;
  locale: string | null;
  type: string;
  size: number;
  accessLevel: string | null;
  uploadStatus: 'PENDING' | 'READY';
  createdAt: string;
  url: string;
}

export interface ServiceFileCreateData {
  name?: string;
  field?: string;
  locale?: string | null;
  accessLevel?: 'private' | 'public';
  file: File;
}

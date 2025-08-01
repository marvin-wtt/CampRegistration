import type { Identifiable } from './Identifiable.js';

export interface ServiceFile extends Identifiable {
  name: string;
  field: string | null;
  type: string;
  size: number;
  accessLevel: string | null;
  createdAt: string;
  url: string;
}

export interface ServiceFileCreateData {
  name?: string;
  field?: string;
  accessLevel?: 'private' | 'public';
  file: File;
}

import type { Identifiable } from '@camp-registration/common/entities';

export interface ServiceFile extends Identifiable {
  name: string;
  field?: string;
  type: string;
  size: number;
  accessLevel: string;
  createdAt: string;
}

export interface FileUploadPayload {
  name: string;
  field: string;
  accessLevel: 'private' | 'public';
  file: File;
}

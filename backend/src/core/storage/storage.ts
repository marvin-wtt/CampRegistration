import type { Readable } from 'stream';

export interface StorageFile {
  id: string;
  originalName: string;
  name: string;
  field: string | null;
  size: number;
  type: string;
  accessLevel: string | null;
  storageLocation: string;
}

export interface Storage {
  removeFile: (fileName: string) => Promise<void>;
  moveToStorage: (filename: string) => Promise<void>;
  getFileNames: () => Promise<string[]>;
  stream: (file: StorageFile) => Readable;
}

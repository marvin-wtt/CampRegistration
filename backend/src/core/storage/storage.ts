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

export interface StorageMoveFile {
  id: string;
  name: string;
  originalName: string;
  type: string;
  tmpFileName: string;
}

export interface StorageDownloadUrlOptions {
  contentDisposition?: string;
}

export interface Storage {
  removeFile: (fileName: string) => Promise<void>;
  moveToStorage: (file: StorageMoveFile) => Promise<void>;
  getFileNames: () => Promise<string[]>;
  openReadStream: (file: StorageFile) => Promise<Readable>;
  createDownloadUrl: (
    file: StorageFile,
    options?: StorageDownloadUrlOptions,
  ) => Promise<string | null>;
}

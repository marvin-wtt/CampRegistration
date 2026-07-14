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
  encryption: string | null;
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
  /**
   * Moves a tmp-dir file into the storage under `filename`. When
   * `sourceFileName` is given, that tmp-dir file is consumed instead (used
   * by EncryptedStorage to move a ciphertext staging file while leaving
   * the plaintext original untouched until the move succeeded).
   */
  moveToStorage: (file: StorageMoveFile) => Promise<void>;
  getFileNames: () => Promise<string[]>;
  openReadStream: (file: StorageFile) => Promise<Readable>;
}

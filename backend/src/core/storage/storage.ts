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

export interface Storage {
  removeFile: (fileName: string) => Promise<void>;
  /**
   * Moves the tmp-dir file named `file.tmpFileName` into the storage under
   * `file.name`. `EncryptedStorage` consumes the same contract by pointing
   * `tmpFileName` at a ciphertext staging file, so drivers never need to
   * know whether the bytes are plaintext or an encryption envelope.
   */
  moveToStorage: (file: StorageMoveFile) => Promise<void>;
  getFileNames: () => Promise<string[]>;
  openReadStream: (file: StorageFile) => Promise<Readable>;
}

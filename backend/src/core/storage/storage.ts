import type fs from 'fs';

export interface StorageFile {
  id: string;
  originalName: string;
  name: string;
  field: string;
  size: number;
  type: string;
  accessLevel: string;
  storageLocation: string;
}

export interface Storage {
  removeFile: (fileName: string) => Promise<void>;
  moveToStorage: (filename: string) => Promise<void>;
  getFileNames: () => Promise<string[]>;
  stream: (file: StorageFile) => fs.ReadStream;
}

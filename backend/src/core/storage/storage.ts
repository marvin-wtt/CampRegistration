import type { File } from '@prisma/client';
import type fs from 'fs';

export interface Storage {
  removeFile: (fileName: string) => Promise<void>;
  moveToStorage: (filename: string) => Promise<void>;
  getFileNames: () => Promise<string[]>;
  stream: (file: File) => fs.ReadStream;
}

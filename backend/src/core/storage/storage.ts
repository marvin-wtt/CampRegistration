import type { File } from '#/generated/prisma/client.js';
import type fs from 'fs';

export interface Storage {
  removeFile: (fileName: string) => Promise<void>;
  moveToStorage: (filename: string) => Promise<void>;
  getFileNames: () => Promise<string[]>;
  stream: (file: File) => fs.ReadStream;
}

import path from 'path';
import fse from 'fs-extra';

function getStoragePath(name: string) {
  return path.join(
    __dirname,
    '..',
    '..',
    '..',
    'tmp',
    'storage',
    'uploads',
    name,
  );
}

export async function uploadFile(name: string, newName?: string) {
  const from = path.join(__dirname, '..', 'resources', name);
  const to = getStoragePath(newName ?? name);

  await fse.copy(from, to);
}

export function verifyFileExists(name: string) {
  return fse.existsSync(getStoragePath(name));
}

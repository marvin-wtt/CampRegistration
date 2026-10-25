import path from 'path';
import fse from 'fs-extra';

function getStoragePath(name: string, dir = 'uploads') {
  return path.join(__dirname, '..', '..', '..', 'tmp', 'storage', dir, name);
}

export async function uploadFile(name: string, newName?: string) {
  const from = path.join(__dirname, '..', 'resources', name);
  const to = getStoragePath(newName ?? name);

  await fse.copy(from, to);
}

export function verifyFileExists(name: string) {
  return fse.existsSync(getStoragePath(name));
}

// An upload the queue hasn't moved into storage yet.
export async function stageUpload(name: string, newName?: string) {
  const from = path.join(__dirname, '..', 'resources', name);
  await fse.copy(from, getStoragePath(newName ?? name, 'tmp'));
}

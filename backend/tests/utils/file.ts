import path from 'path';
import fse from 'fs-extra';

export async function uploadFile(name: string, newName?: string) {
  const from = path.join(__dirname, '..', 'integration', 'resources', name);
  const to = path.join(
    __dirname,
    '..',
    'tmp',
    'storage',
    'uploads',
    newName ?? name,
  );

  await fse.copy(from, to);
}

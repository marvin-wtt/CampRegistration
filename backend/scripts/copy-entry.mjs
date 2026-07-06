import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');

const source = resolve(projectRoot, 'src', 'entry.cjs');
const destinationDirectory = resolve(projectRoot, 'build');
const destination = resolve(destinationDirectory, 'entry.cjs');

await mkdir(destinationDirectory, { recursive: true });
await copyFile(source, destination);

console.log(`Copied ${source} to ${destination}`);

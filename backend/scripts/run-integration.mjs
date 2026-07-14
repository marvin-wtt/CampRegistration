import { spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');

config({ path: resolve(projectRoot, '.env.test'), quiet: true });

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
  });

  return result.status ?? 1;
}

function waitForPort(host, port, timeout = 30_000, interval = 500) {
  return new Promise((resolvePromise, reject) => {
    const start = Date.now();

    const attempt = () => {
      const socket = createConnection({ host, port });

      socket.once('connect', () => {
        socket.end();
        resolvePromise();
      });

      socket.once('error', () => {
        socket.destroy();

        if (Date.now() - start > timeout) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }

        setTimeout(attempt, interval);
      });
    };

    attempt();
  });
}

console.log('🟡 - Starting test containers...');
if (
  run('docker-compose', ['--profile', 'test', '-p', 'app_test', 'up', '-d']) !==
  0
) {
  console.error('🔴 - Failed to start containers. Exiting...');
  process.exit(1);
}

console.log('🟡 - Waiting for database to be ready...');
const { hostname, port } = new URL(process.env.DATABASE_URL);

try {
  await waitForPort(hostname, Number(port));
} catch {
  console.error('🔴 - Database is not ready. Exiting...');
  process.exit(1);
}
console.log('🟢 - Database is ready!');

if (
  run('npx', [
    'prisma',
    'db',
    'push',
    '--force-reset',
    '--accept-data-loss',
  ]) !== 0
) {
  console.error('🔴 - Resetting database failed. Exiting...');
  process.exit(1);
}

const passthroughArgs = process.argv.slice(2);
const status = run('npx', [
  'vitest',
  '-c',
  './vitest.config.integration.ts',
  ...passthroughArgs,
]);

process.exit(status);

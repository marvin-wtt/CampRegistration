import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Playwright suffixes snapshot filenames with the host platform, but CI only
// ever renders inside this same Linux image — baselines updated natively on
// another OS (Windows, macOS) never match what CI compares against. This runs
// the update inside the exact CI image instead.
//
// `node_modules` is bind-mounted from named volumes, never the host
// directories: reinstalling here for Linux must not clobber the host's own
// native bindings (e.g. rolldown's platform-specific package).
const PLAYWRIGHT_IMAGE = 'mcr.microsoft.com/playwright:v1.61.1-noble';
const VOLUME_PREFIX = 'camp-registration-visual';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, '..', '..');

const workspaceNodeModules = ['', 'common', 'backend', 'frontend', 'e2e'].map(
  (workspace) => (workspace ? `${workspace}/node_modules` : 'node_modules'),
);

const volumeArgs = workspaceNodeModules.flatMap((path) => [
  '-v',
  `${VOLUME_PREFIX}-${path.replace(/\//g, '-')}:/work/${path}`,
]);

const containerCommand = [
  'npm ci',
  'npm run build --workspace common',
  'npm run test:visual:update:local --workspace backend',
].join(' && ');

const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--ipc=host',
    '-v',
    `${repoRoot}:/work`,
    ...volumeArgs,
    '-w',
    '/work',
    PLAYWRIGHT_IMAGE,
    'bash',
    '-c',
    containerCommand,
  ],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);

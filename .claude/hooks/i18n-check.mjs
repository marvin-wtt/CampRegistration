// PostToolUse(Write|Edit): keep the five locales in sync.
//
// A user-facing string has to exist in every locale (see CLAUDE.md pitfall #4),
// and those strings live in two places: the global src/i18n/<region>/ trees and
// inline <i18n> blocks in SFCs. Run frontend/scripts/i18n/check.mjs whenever a
// file of either kind changes, and hand any problem back to Claude as context.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let file = '';
try {
  file = JSON.parse(readFileSync(0, 'utf8')).tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

const path = file.split('\\').join('/');
if (!path.includes('/frontend/src/')) {
  process.exit(0);
}

const carriesTranslations =
  path.includes('/frontend/src/i18n/') ||
  (path.endsWith('.vue') && readSafely(path).includes('<i18n'));
if (!carriesTranslations) {
  process.exit(0);
}

const result = spawnSync('node', ['scripts/i18n/check.mjs'], {
  cwd: join(root, 'frontend'),
  encoding: 'utf8',
});

if (result.status !== 0) {
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `i18n check failed — every user-facing string must exist in all five locales (en, de, fr, pl, cs):\n\n${output}`,
      },
    }),
  );
}

function readSafely(p) {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

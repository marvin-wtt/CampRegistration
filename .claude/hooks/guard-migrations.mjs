// PreToolUse(Write|Edit): an applied Prisma migration is immutable.
//
// Editing a migration that has already run rewrites history for every database
// that applied it. The one legitimate edit is hand-written backfill SQL added
// with `--create-only` before the first apply, so this asks rather than denies.
import { readFileSync } from 'node:fs';

let file = '';
try {
  file = JSON.parse(readFileSync(0, 'utf8')).tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

const path = file.split('\\').join('/');
if (!path.includes('/prisma/migrations/')) {
  process.exit(0);
}

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        'Migration guard: never edit a migration that has already been applied. Approve only for backfill SQL in a `--create-only` migration that has not run yet.',
    },
  }),
);

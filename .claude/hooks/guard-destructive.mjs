// PreToolUse(Bash|PowerShell): require explicit approval for destructive commands.
//
// Covers database resets/truncations and history-rewriting git commands, which
// are cheap to type and expensive to undo.
import { readFileSync } from 'node:fs';

const DESTRUCTIVE =
  /db:reset|db:truncate|migrate\s+reset|--force-reset|--accept-data-loss|push\s+\S.*(--force|\s-f\b)|push\s+(--force|-f)\b|reset\s+--hard/;

let command = '';
try {
  command = JSON.parse(readFileSync(0, 'utf8')).tool_input?.command ?? '';
} catch {
  process.exit(0);
}

if (!DESTRUCTIVE.test(command)) {
  process.exit(0);
}

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        'Risky command guard: destructive command - explicit approval required.',
    },
  }),
);

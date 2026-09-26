// PostToolUse(Write|Edit): format the file that was just written.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

let file = '';
try {
  file = JSON.parse(readFileSync(0, 'utf8')).tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

if (file) {
  spawnSync(`npx prettier --write --ignore-unknown "${file}"`, {
    stdio: 'ignore',
    shell: true,
  });
}

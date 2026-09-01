import { execSync } from "node:child_process";

/**
 * Runs a backend npm script, failing with the child's own diagnostics.
 *
 * `execSync` puts only "Command failed" on its error, and `stdio: "inherit"`
 * sends the child's message to the CI console instead of the test report — so
 * a seed failure reaches the Playwright artifact with no cause attached. Keep
 * the output, and record `status`/`signal` too: a `SIGKILL` points at the
 * runner OOM-killing the process, a Prisma error code points at the database.
 */
function run(script: string): void {
  try {
    // A shell string rather than `execFileSync`, so `npm` still resolves to
    // `npm.cmd` for local Windows runs.
    execSync(`npm run ${script} -w ../backend`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    const { status, signal, stdout, stderr } = err as {
      status?: number;
      signal?: string;
      stdout?: string;
      stderr?: string;
    };

    throw new Error(
      `npm run ${script} failed (status=${status}, signal=${signal})\n` +
        `--- stdout ---\n${stdout ?? ""}\n` +
        `--- stderr ---\n${stderr ?? ""}`,
    );
  }
}

export function resetDatabase(): void {
  run("db:reset");
}

export function seedE2eDatabase(): void {
  run("db:seed:e2e");
}

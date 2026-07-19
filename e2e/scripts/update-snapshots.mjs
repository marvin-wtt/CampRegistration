import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Regenerates the Playwright visual-regression baselines. Screenshot baselines
// are platform-specific (they are stored with a `-linux` suffix and compared on
// the ubuntu-24.04 CI runners), so they cannot be captured on the host OS.
// Instead this script runs the full stack — npm install, workspace builds,
// migrations, backend server, and the Chromium projects of the visual specs —
// inside the official Playwright Docker image (Ubuntu noble, matching CI),
// with the repository mounted so the updated baselines land in the working
// tree. The schema itself is provisioned by the suite's own globalSetup
// (`prisma db push --force-reset`), so no migration step is needed here.
//
// Host node_modules and the generated Prisma client contain host-native
// binaries, so they are shadowed with named Docker volumes inside the
// container. The volumes double as a cache: the first run installs and builds
// everything (slow), later runs skip `npm ci` while the lockfile is unchanged.
//
// Usage: npm run update-snapshots --workspace e2e [-- <extra playwright args>]
//   e.g. npm run update-snapshots --workspace e2e -- -g "registration closed"

const exec = promisify(execCb);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e2eDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(e2eDir, "..");
// Docker only accepts forward slashes in bind-mount sources, including for
// Windows drive paths (`C:/Users/...`).
const repoRootMount = repoRoot.replaceAll("\\", "/");

const VOLUME_PREFIX = "campregistration-snapshots";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

function waitForPort(host, port, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = createConnection({ host, port });

      const retryOrFail = () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 1000);
      };

      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", retryOrFail);
      socket.setTimeout(2000, retryOrFail);
    };

    attempt();
  });
}

function playwrightVersion() {
  const packageJson = path.join(
    repoRoot,
    "node_modules",
    "@playwright",
    "test",
    "package.json",
  );

  try {
    return JSON.parse(readFileSync(packageJson, "utf8")).version;
  } catch {
    throw new Error(
      "Could not resolve the installed @playwright/test version — run `npm install` first.",
    );
  }
}

/** Quote an argument for use inside the container's `bash -c` script. */
function shellQuote(arg) {
  return `'${arg.replaceAll("'", `'\\''`)}'`;
}

async function main() {
  const extraArgs = process.argv.slice(2).map(shellQuote).join(" ");
  const image = `mcr.microsoft.com/playwright:v${playwrightVersion()}-noble`;

  console.log("Starting Docker services...");
  await run("docker-compose", ["up", "-d"], { cwd: e2eDir, shell: true });

  console.log("Waiting for database at localhost:3308...");
  await waitForPort("localhost", 3308);

  // Attach the Playwright container to the compose network so the backend it
  // spawns can reach the db/mail services by their service names.
  const { stdout: containerId } = await exec("docker-compose ps -q db", {
    cwd: e2eDir,
  });
  const { stdout: network } = await exec(
    `docker inspect -f "{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}" ${containerId.trim()}`,
  );

  // Install + build + migrate + capture, all inside the container. `npm ci` is
  // skipped while the lockfile hash stored in the node_modules volume matches.
  const containerScript = `
    set -euo pipefail
    lock_hash="$(sha256sum package-lock.json | cut -d" " -f1)"
    if [ ! -f node_modules/.snapshot-lock-hash ] || [ "$(cat node_modules/.snapshot-lock-hash)" != "$lock_hash" ]; then
      npm ci --no-audit --no-fund
      echo "$lock_hash" > node_modules/.snapshot-lock-hash
    fi
    npm run build
    cd e2e
    npx playwright test visual.spec --project=chromium --project=mobile-chrome --update-snapshots ${extraArgs}
  `;

  console.log(`Updating snapshots in ${image}...`);
  await run("docker", [
    "run",
    "--rm",
    "--init",
    // Chromium needs more shared memory than the container default
    "--ipc=host",
    `--network=${network.trim()}`,
    "-v",
    `${repoRootMount}:/work`,
    // Shadow host node_modules (host-native binaries) and the generated Prisma
    // client (host-native query engine) with reusable Linux-side volumes.
    "-v",
    `${VOLUME_PREFIX}-node-modules:/work/node_modules`,
    "-v",
    `${VOLUME_PREFIX}-nm-common:/work/common/node_modules`,
    "-v",
    `${VOLUME_PREFIX}-nm-backend:/work/backend/node_modules`,
    "-v",
    `${VOLUME_PREFIX}-nm-frontend:/work/frontend/node_modules`,
    "-v",
    `${VOLUME_PREFIX}-nm-e2e:/work/e2e/node_modules`,
    "-v",
    `${VOLUME_PREFIX}-prisma-client:/work/backend/src/generated`,
    "-v",
    `${VOLUME_PREFIX}-npm-cache:/root/.npm`,
    "-w",
    "/work",
    // Point the stack at the compose services; these take precedence over the
    // localhost values in backend/.env.e2e (dotenv never overrides existing
    // process.env entries).
    "-e",
    "DATABASE_URL=mysql://root:root@db:3308/database",
    "-e",
    "SHADOW_DATABASE_URL=mysql://root:root@db:3308/shadow_database",
    "-e",
    "SMTP_HOST=mail",
    "-e",
    "MAILDEV_HOST=mail",
    image,
    "bash",
    "-c",
    containerScript,
  ]);

  console.log("Done. Updated baselines are in e2e/tests/**/*-snapshots/.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

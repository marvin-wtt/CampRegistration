import { config } from "dotenv";
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e2eDir = path.resolve(__dirname, "..");
const backendEnvFile = path.resolve(e2eDir, "../backend/.env.e2e");

config({ path: backendEnvFile });

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} ${args.join(" ")} exited with code ${code}`),
        );
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

function parseHostPort(databaseUrl) {
  const match = databaseUrl.match(/^[^@]+@([^/]+)\//);
  if (!match) {
    throw new Error(
      `Could not parse host/port from DATABASE_URL: ${databaseUrl}`,
    );
  }

  const [host, port] = match[1].split(":");
  return { host, port: Number(port) };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set (expected in backend/.env.e2e)");
  }
  const { host, port } = parseHostPort(databaseUrl);

  console.log("Starting Docker services...");
  await run("docker-compose", ["up", "-d"], { cwd: e2eDir });

  console.log(`Waiting for database at ${host}:${port}...`);
  await waitForPort(host, port);
  console.log("Database is ready!");

  await run("npm", ["run", "dev:run"], { cwd: e2eDir });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

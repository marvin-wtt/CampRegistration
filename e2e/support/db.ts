import { execSync } from "node:child_process";

export function resetDatabase(): void {
  execSync("npm run db:reset -w ../backend", { stdio: "inherit" });
}

export function seedE2eDatabase(): void {
  execSync("npm run db:seed:e2e -w ../backend", { stdio: "inherit" });
}

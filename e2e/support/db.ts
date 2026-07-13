import { execSync } from "node:child_process";

export function resetDatabase(): void {
  execSync("npm run db:reset -w ../backend", { stdio: "inherit" });
}

export function truncateDatabase(): void {
  execSync("npm run db:truncate -w ../backend", { stdio: "inherit" });
}

export function seedDatabase(): void {
  execSync("npm run db:seed -w ../backend", { stdio: "inherit" });
}

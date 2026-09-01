import { resetDatabase } from "./db";

export default function globalSetup(): void {
  resetDatabase();
}

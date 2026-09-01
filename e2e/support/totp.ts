import { generate } from "otplib";

export function generateTotp(secret: string): Promise<string> {
  return generate({ secret });
}

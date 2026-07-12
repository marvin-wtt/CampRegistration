import { randomBytes } from 'node:crypto';

// Generates the security secrets required by the backend and prints them in
// .env format so they can be copied or piped directly into an env file:
//
//   node scripts/generate-secrets.mjs >> .env

const SECRET_NAMES = ['JWT_SECRET', 'CSRF_SECRET', 'TOTP_RECOVERY_CODE_SECRET'];

for (const name of SECRET_NAMES) {
  console.log(`${name}="${randomBytes(32).toString('base64')}"`);
}

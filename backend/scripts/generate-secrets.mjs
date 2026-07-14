import { randomBytes } from 'node:crypto';

// Generates the security secrets required by the backend and prints them in
// .env format so they can be copied or piped directly into an env file:
//
//   node scripts/generate-secrets.mjs >> .env

const SECRET_NAMES = ['JWT_SECRET', 'CSRF_SECRET', 'TOTP_RECOVERY_CODE_SECRET'];

function generateSecret() {
  return randomBytes(32).toString('base64');
}

function generateFileEncryptionKey() {
  // Format: kYYYYMMDD-NN:secret
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const keyId = `k${date}-01`;
  const key = generateSecret();

  return `${keyId}:${key}`;
}

for (const name of SECRET_NAMES) {
  console.log(`${name}="${generateSecret()}"`);
}

console.log(`STORAGE_ENCRYPTION_KEYS="${generateFileEncryptionKey()}"`);

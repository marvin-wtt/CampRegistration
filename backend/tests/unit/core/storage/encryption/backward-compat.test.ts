import path from 'path';
import { Readable } from 'stream';
import fse from 'fs-extra';
import { describe, expect, it } from 'vitest';
import { parseStorageKeyring } from '#core/storage/encryption/keyring';
import { createDecryptStream } from '#core/storage/encryption/envelope';

/**
 * `tests/unit/core/storage/encryption/fixtures/prod-file.enc` is a real ESDK
 * envelope, generated once and frozen — it stands in for a file already
 * sitting encrypted on disk in production. It must keep decrypting under
 * whatever `KEY_NAMESPACE`/`ENCRYPTION_CONTEXT`/wrapping suite the code
 * carries at any point in time; if this test ever fails, do not "fix" the
 * fixture — treat it as proof that a code change would strand every
 * already-encrypted production file (see keyring.ts / envelope.ts comments).
 *
 * Regenerate only if production files were actually re-encrypted end to end
 * (see docs/... migration notes): parseStorageKeyring('fixture-key:<key>'),
 * createEncryptStream, encrypt the plaintext below, and overwrite the file.
 */
const KEY_ID = 'fixture-key';
const KEY_B64 = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
const PLAINTEXT =
  'CampRegistration production backward-compatibility fixture — do not touch.';

describe('encryption backward compatibility', () => {
  it('decrypts a file encrypted under the production key namespace and context', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'prod-file.enc');
    const ciphertext = await fse.readFile(fixturePath);

    const keyring = parseStorageKeyring(`${KEY_ID}:${KEY_B64}`);
    const decrypted = createDecryptStream(
      keyring.decrypt,
      Readable.from([ciphertext]),
      Buffer.byteLength(PLAINTEXT, 'utf8'),
    );

    const chunks: Buffer[] = [];
    for await (const chunk of decrypted) {
      chunks.push(chunk as Buffer);
    }

    expect(Buffer.concat(chunks).toString('utf8')).toBe(PLAINTEXT);
  });
});

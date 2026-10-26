import {
  AlgorithmSuiteIdentifier,
  CommitmentPolicy,
  buildClient,
} from '@aws-crypto/client-node';
import config from '#config/index';
import {
  parseStorageKeyring,
  type StorageKeyring,
} from '#core/storage/encryption/keyring';

// Baked into every encrypted secret; changing either breaks decryption of
// secrets already stored. NOT tied to the product name — never rename.
const KEY_NAMESPACE = 'camp-registration/secrets';
const ENCRYPTION_CONTEXT_KEY = 'purpose';

const { encrypt, decrypt } = buildClient({
  commitmentPolicy: CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT,
  maxEncryptedDataKeys: 8,
});

let keyring: StorageKeyring | null | undefined;

function getKeyring(): StorageKeyring | null {
  if (keyring === undefined) {
    const spec = config.secrets.encryptionKeys;
    keyring = spec
      ? parseStorageKeyring(spec, KEY_NAMESPACE, 'SECRETS_ENCRYPTION_KEYS')
      : null;
  }

  return keyring;
}

export class SecretsUnavailableError extends Error {
  constructor() {
    super(
      'Secret encryption is not configured: set SECRETS_ENCRYPTION_KEYS to store credentials.',
    );
  }
}

/** Whether secrets can be stored at all — they are never stored in plaintext. */
export function secretsAvailable(): boolean {
  return getKeyring() !== null;
}

/**
 * Field-level encryption for small secrets (API keys, webhook secrets) at
 * rest, with master keys of their own (`SECRETS_ENCRYPTION_KEYS`) in the same
 * `keyId:key` format and rotation as file storage. `purpose` is
 * bound into the ciphertext and checked on decrypt, so a secret stored for
 * one use can't be substituted for another.
 */
export async function encryptSecret(
  plaintext: string,
  purpose: string,
): Promise<string> {
  const ring = getKeyring();
  if (!ring) {
    throw new SecretsUnavailableError();
  }

  const { result } = await encrypt(ring.encrypt, Buffer.from(plaintext), {
    suiteId:
      AlgorithmSuiteIdentifier.ALG_AES256_GCM_IV12_TAG16_HKDF_SHA512_COMMIT_KEY,
    encryptionContext: { [ENCRYPTION_CONTEXT_KEY]: purpose },
  });

  return Buffer.from(result).toString('base64');
}

export async function decryptSecret(
  ciphertext: string,
  purpose: string,
): Promise<string> {
  const ring = getKeyring();
  if (!ring) {
    throw new SecretsUnavailableError();
  }

  const { plaintext, messageHeader } = await decrypt(
    ring.decrypt,
    Buffer.from(ciphertext, 'base64'),
  );

  if (messageHeader.encryptionContext[ENCRYPTION_CONTEXT_KEY] !== purpose) {
    throw new Error('Secret was encrypted for a different purpose');
  }

  return Buffer.from(plaintext).toString('utf8');
}

/** Test seam: forget the cached keyring so a changed config is picked up. */
export function resetSecretsKeyring(): void {
  keyring = undefined;
}

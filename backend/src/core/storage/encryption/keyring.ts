import {
  MultiKeyringNode,
  RawAesKeyringNode,
  RawAesWrappingSuiteIdentifier,
  type KeyringNode,
} from '@aws-crypto/client-node';

const KEY_LENGTH = 32;
const MAX_KEY_ID_LENGTH = 255;

// Baked into every encrypted message; changing it breaks decryption.
const KEY_NAMESPACE = 'camp-registration/file-storage';

/**
 * Encrypt and decrypt are separate keyrings on purpose: a multi-keyring
 * wraps the data key with *every* member on encrypt, so using one keyring
 * for both would let a rotated-out (possibly compromised) key decrypt
 * newly written files.
 */
export interface StorageKeyring {
  /** The first configured key only — wraps the data key of new files. */
  encrypt: KeyringNode;
  /** All configured keys — old keys stay readable after rotation. */
  decrypt: KeyringNode;
}

/**
 * Builds the ESDK keyrings holding the master keys that wrap per-file data
 * keys, from a `keyId:base64Key[,keyId:base64Key...]` spec (see
 * `STORAGE_ENCRYPTION_KEYS`). The first key encrypts new files; the
 * remaining keys can only decrypt files written while they were first.
 * Keys must decode to exactly 32 bytes, e.g. generated with
 * `openssl rand -base64 32`.
 */
export function parseStorageKeyring(spec: string): StorageKeyring {
  const entries = spec
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    throw new Error('STORAGE_ENCRYPTION_KEYS contains no keys');
  }

  const seen = new Set<string>();
  const keyrings = entries.map((entry) => {
    const separatorIndex = entry.indexOf(':');
    if (separatorIndex <= 0) {
      throw new Error(
        'STORAGE_ENCRYPTION_KEYS entries must have the form "keyId:base64Key"',
      );
    }

    const id = entry.slice(0, separatorIndex).trim();
    const encodedKey = entry.slice(separatorIndex + 1).trim();

    if (id.length === 0 || Buffer.byteLength(id, 'utf8') > MAX_KEY_ID_LENGTH) {
      throw new Error('STORAGE_ENCRYPTION_KEYS contains an invalid key id');
    }
    if (seen.has(id)) {
      throw new Error(
        `STORAGE_ENCRYPTION_KEYS contains duplicate key id "${id}"`,
      );
    }
    seen.add(id);

    const key = Buffer.from(encodedKey, 'base64');
    if (key.length !== KEY_LENGTH) {
      throw new Error(
        `STORAGE_ENCRYPTION_KEYS key "${id}" must be ${KEY_LENGTH.toString()} bytes of base64 (e.g. \`openssl rand -base64 32\`)`,
      );
    }

    return new RawAesKeyringNode({
      keyName: id,
      keyNamespace: KEY_NAMESPACE,
      // The ESDK rejects views into Node's shared buffer pool; copy the key
      // into a buffer that owns its whole allocation.
      unencryptedMasterKey: new Uint8Array(key),
      wrappingSuite:
        RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING,
    });
  });

  const [generator, ...children] = keyrings;

  return {
    encrypt: generator,
    decrypt:
      children.length === 0
        ? generator
        : new MultiKeyringNode({ generator, children }),
  };
}

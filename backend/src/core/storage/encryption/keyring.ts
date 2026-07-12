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
 * Builds the ESDK keyring holding the master keys that wrap per-file data
 * keys, from a `keyId:base64Key[,keyId:base64Key...]` spec (see
 * `STORAGE_ENCRYPTION_KEYS`). The first key encrypts new files; all keys
 * remain available for decryption so that keys can be rotated without
 * re-encrypting existing files. Keys must decode to exactly 32 bytes,
 * e.g. generated with `openssl rand -base64 32`.
 */
export function parseStorageKeyring(spec: string): KeyringNode {
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

  return children.length === 0
    ? generator
    : new MultiKeyringNode({ generator, children });
}

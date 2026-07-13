import {
  PassThrough,
  Transform,
  type Duplex,
  type Readable,
  type TransformCallback,
} from 'stream';
import { pipeline } from 'stream/promises';
import {
  AlgorithmSuiteIdentifier,
  CommitmentPolicy,
  buildClient,
  type KeyringNode,
} from '@aws-crypto/client-node';

/**
 * Files are stored as bare AWS Encryption SDK messages. The ESDK handles
 * per-file data keys, framed authenticated encryption (no plaintext is
 * emitted from an unverified frame), key commitment, and key rotation via
 * the keyring. Whether (and how) a stored file is encrypted is recorded on
 * the `File` model (`encryption` column); this constant is its value for
 * the ESDK envelope.
 */
export const ENCRYPTION_FORMAT = 'aws-esdk';

// Signed suites cannot be decrypted as a stream (the trailing ECDSA
// signature only verifies after the plaintext was emitted), so files are
// encrypted with the unsigned key-committing suite.
const SUITE_ID =
  AlgorithmSuiteIdentifier.ALG_AES256_GCM_IV12_TAG16_HKDF_SHA512_COMMIT_KEY;
const ENCRYPTION_CONTEXT = {
  app: 'camp-registration',
  purpose: 'file-storage',
};

const { encryptStream, decryptUnsignedMessageStream } = buildClient({
  commitmentPolicy: CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT,
  maxEncryptedDataKeys: 8,
});

/** Fails the stream when the decrypted byte count is off. */
class LengthGuard extends Transform {
  private seen = 0;

  constructor(private readonly expected: number) {
    super();
  }

  _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.seen += chunk.length;
    if (this.seen > this.expected) {
      callback(
        new Error(
          `Decrypted file is larger than the expected ${this.expected.toString()} bytes`,
        ),
      );
      return;
    }
    callback(null, chunk);
  }

  _flush(callback: TransformCallback): void {
    callback(
      this.seen === this.expected
        ? null
        : new Error(
            `Decrypted file is ${this.seen.toString()} bytes, expected ${this.expected.toString()}`,
          ),
    );
  }
}

/** Transform producing an ESDK envelope from a plaintext stream. */
export function createEncryptStream(keyring: KeyringNode): Duplex {
  return encryptStream(keyring, {
    suiteId: SUITE_ID,
    encryptionContext: ENCRYPTION_CONTEXT,
  });
}

/**
 * Returns a stream of the decrypted contents of an ESDK envelope; source
 * and decryption errors destroy the returned stream. `expectedSize` (the
 * plaintext size from the file model, when known) guards against silent
 * truncation.
 */
export function createDecryptStream(
  keyring: KeyringNode,
  source: Readable,
  expectedSize?: number,
): Readable {
  const out = new PassThrough();

  const guards =
    expectedSize !== undefined ? [new LengthGuard(expectedSize)] : [];

  pipeline([
    source,
    decryptUnsignedMessageStream(keyring),
    ...guards,
    out,
  ]).catch((error: unknown) => {
    out.destroy(error as Error);
  });

  return out;
}

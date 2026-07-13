import { open } from 'fs/promises';
import {
  PassThrough,
  Readable,
  Transform,
  type Duplex,
  type TransformCallback,
} from 'stream';
import { pipeline } from 'stream/promises';
import {
  AlgorithmSuiteIdentifier,
  CommitmentPolicy,
  buildClient,
  type KeyringNode,
} from '@aws-crypto/client-node';
import { KEY_NAMESPACE } from '#core/storage/encryption/keyring';

/**
 * Envelope for files encrypted at rest: our 8-byte magic prefix followed by
 * an AWS Encryption SDK message. The ESDK handles per-file data keys, framed
 * authenticated encryption (no plaintext is emitted from an unverified
 * frame), key commitment, and key rotation via the keyring. The magic prefix
 * exists so that files stored before encryption was enabled can be detected
 * and streamed back unchanged.
 */
export const MAGIC = Buffer.from('CAMPENC1', 'ascii');

// Signed suites cannot be decrypted as a stream (the trailing ECDSA
// signature only verifies after the plaintext was emitted), so files are
// encrypted with the unsigned key-committing suite.
const SUITE_ID =
  AlgorithmSuiteIdentifier.ALG_AES256_GCM_IV12_TAG16_HKDF_SHA512_COMMIT_KEY;
const ENCRYPTION_CONTEXT = {
  app: 'camp-registration',
  purpose: 'file-storage',
};
// Generous upper bound for an ESDK header with our single-EDK messages,
// used by the retry probe in `isEncryptedByUs`.
const PROBE_LENGTH = 4096;

const { encryptStream, decryptUnsignedMessageStream } = buildClient({
  commitmentPolicy: CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT,
  maxEncryptedDataKeys: 8,
});

class PrependMagic extends Transform {
  private pushed = false;

  _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.ensureMagic();
    callback(null, chunk);
  }

  _flush(callback: TransformCallback): void {
    this.ensureMagic();
    callback();
  }

  private ensureMagic(): void {
    if (!this.pushed) {
      this.pushed = true;
      this.push(MAGIC);
    }
  }
}

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

/** Transforms to pipe a plaintext stream through to produce an envelope. */
export function createEncryptStreams(keyring: KeyringNode): Duplex[] {
  return [
    encryptStream(keyring, {
      suiteId: SUITE_ID,
      encryptionContext: ENCRYPTION_CONTEXT,
    }),
    new PrependMagic(),
  ];
}

/**
 * Reads the first `length` bytes of `source` and returns them together with
 * a stream over all remaining bytes. The prefix is shorter than requested
 * only when the source ends first.
 */
async function peek(
  source: Readable,
  length: number,
): Promise<{ prefix: Buffer; rest: Readable }> {
  const iterator = source[Symbol.asyncIterator]() as AsyncIterator<
    Buffer,
    undefined
  >;
  const chunks: Buffer[] = [];
  let total = 0;

  while (total < length) {
    const { done, value } = await iterator.next();
    if (done) {
      break;
    }
    chunks.push(value);
    total += value.length;
  }

  const buffered = Buffer.concat(chunks);
  const surplus = buffered.subarray(length);

  const rest = Readable.from(
    (async function* () {
      try {
        if (surplus.length > 0) {
          yield surplus;
        }
        for (;;) {
          const { done, value } = await iterator.next();
          if (done) {
            return;
          }
          yield value;
        }
      } finally {
        await iterator.return?.();
      }
    })(),
  );

  return { prefix: buffered.subarray(0, length), rest };
}

/**
 * Returns a stream of the decrypted file contents. Sources without the magic
 * prefix (files stored before encryption was enabled) are passed through
 * unchanged; source and decryption errors destroy the returned stream.
 * `expectedSize` (the plaintext size from the file model, when known) guards
 * encrypted reads against silent truncation. A `null` keyring (encryption
 * not configured) still passes plaintext through, but fails loudly on
 * encrypted sources instead of serving raw ciphertext.
 */
export function createDecryptStream(
  keyring: KeyringNode | null,
  source: Readable,
  expectedSize?: number,
): Readable {
  const out = new PassThrough();

  const route = async () => {
    const { prefix, rest } = await peek(source, MAGIC.length);

    if (prefix.equals(MAGIC)) {
      if (keyring === null) {
        throw new Error(
          'File is encrypted at rest, but STORAGE_ENCRYPTION_KEYS is not configured',
        );
      }
      const guards =
        expectedSize !== undefined ? [new LengthGuard(expectedSize)] : [];
      await pipeline([
        rest,
        decryptUnsignedMessageStream(keyring),
        ...guards,
        out,
      ]);
      return;
    }

    if (prefix.length > 0) {
      out.write(prefix);
    }
    await pipeline(rest, out);
  };

  route().catch((error: unknown) => {
    out.destroy(error as Error);
  });

  return out;
}

async function readProbe(filePath: string): Promise<Buffer> {
  const buffer = Buffer.alloc(PROBE_LENGTH);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const handle = await open(filePath, 'r');
  let bytesRead: number;
  try {
    ({ bytesRead } = await handle.read(buffer, 0, buffer.length, 0));
  } finally {
    await handle.close();
  }

  return buffer.subarray(0, bytesRead);
}

/** Whether the file starts with the envelope magic bytes. */
export async function hasMagicPrefix(filePath: string): Promise<boolean> {
  const probe = await readProbe(filePath);

  return (
    probe.length >= MAGIC.length &&
    probe.subarray(0, MAGIC.length).equals(MAGIC)
  );
}

// Structural (non-cryptographic) shape of our envelopes: ESDK message format
// v2 (the only format for committing suites), our pinned suite id, and our
// key namespace embedded in an EDK. Forgeable by an uploader, but forging it
// only makes their own upload job fail — see `isEncryptedByUs`.
// The suite id as it appears serialized in a message header.
const SUITE_ID_VALUE: number = SUITE_ID;

function looksLikeOurEnvelope(body: Buffer): boolean {
  return (
    body.length >= 3 &&
    body[0] === 0x02 &&
    body.readUInt16BE(1) === SUITE_ID_VALUE &&
    body.includes(KEY_NAMESPACE)
  );
}

/**
 * Cryptographically checks whether the file was encrypted by us: the magic
 * prefix alone could be forged by an uploaded file, but the ESDK message
 * header only parses when one of our master keys authentically unwraps its
 * data key. Used to keep retried upload jobs from encrypting twice.
 *
 * When the header cannot be unwrapped but the file structurally matches our
 * envelope format, the promise rejects instead of resolving `false`:
 * encrypting such a file again would wrap ciphertext whose key may have been
 * rotated away, silently and irreversibly corrupting it. Failing the upload
 * job is recoverable; double encryption is not. (A crafted plaintext upload
 * can spoof the structural match, but that only fails the uploader's own
 * job.)
 */
export async function isEncryptedByUs(
  keyring: KeyringNode,
  filePath: string,
): Promise<boolean> {
  const probe = await readProbe(filePath);
  if (
    probe.length < MAGIC.length ||
    !probe.subarray(0, MAGIC.length).equals(MAGIC)
  ) {
    return false;
  }

  const body = probe.subarray(MAGIC.length);
  const decryptor = decryptUnsignedMessageStream(keyring);

  return new Promise<boolean>((resolve, reject) => {
    // `on` rather than `once`: post-settlement errors (e.g. the probe ends
    // mid-body) must be swallowed, not raised as unhandled.
    decryptor.on('MessageHeader', () => {
      resolve(true);
    });
    decryptor.on('error', (error: Error) => {
      if (looksLikeOurEnvelope(body)) {
        reject(
          new Error(
            `File "${filePath}" looks like it was encrypted by us, but no configured key can read it — refusing to encrypt it again. Was a key removed from STORAGE_ENCRYPTION_KEYS?`,
            { cause: error },
          ),
        );
      } else {
        resolve(false);
      }
    });
    decryptor.resume();

    Readable.from([body]).pipe(decryptor);
  }).finally(() => {
    decryptor.destroy();
  });
}

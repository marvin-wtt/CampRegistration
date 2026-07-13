import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { PassThrough, Readable } from 'stream';
import { pipeline } from 'stream/promises';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EncryptedStorage } from '#core/storage/encrypted.storage';
import {
  parseStorageKeyring,
  type StorageKeyring,
} from '#core/storage/encryption/keyring';
import {
  ENCRYPTION_FORMAT,
  createDecryptStream,
  createEncryptStream,
} from '#core/storage/encryption/envelope';
import type { Storage, StorageFile } from '#core/storage/storage';

const KEY_1 = crypto.randomBytes(32).toString('base64');
const KEY_2 = crypto.randomBytes(32).toString('base64');

const keyring = parseStorageKeyring(`k1:${KEY_1}`);

const storageFile = (
  name: string,
  size = 0,
  encryption: string | null = ENCRYPTION_FORMAT,
): StorageFile => ({
  id: name,
  originalName: name,
  name,
  field: null,
  size,
  type: 'application/octet-stream',
  accessLevel: null,
  storageLocation: 'memory',
  encryption,
});

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
};

const encrypt = async (
  data: Buffer,
  ring: StorageKeyring = keyring,
): Promise<Buffer> => {
  const out = new PassThrough();
  const collected = streamToBuffer(out);
  await pipeline([
    Readable.from([data]),
    createEncryptStream(ring.encrypt),
    out,
  ]);
  return collected;
};

const decrypt = (
  data: Buffer,
  ring: StorageKeyring = keyring,
): Promise<Buffer> =>
  streamToBuffer(createDecryptStream(ring.decrypt, Readable.from([data])));

/**
 * Inner driver shaped like a future object storage driver: `moveToStorage`
 * consumes the tmp file into an opaque blob store and `stream` feeds a
 * PassThrough asynchronously.
 */
class MemoryStorage implements Storage {
  files = new Map<string, Buffer>();
  moveCalls = 0;
  failNextMove = false;

  constructor(private readonly tmpDir: string) {}

  async removeFile(fileName: string): Promise<void> {
    this.files.delete(fileName);
  }

  async moveToStorage(
    filename: string,
    sourceFileName = filename,
  ): Promise<void> {
    this.moveCalls++;
    if (this.failNextMove) {
      this.failNextMove = false;
      throw new Error('inner storage unavailable');
    }

    const filePath = path.join(this.tmpDir, sourceFileName);
    this.files.set(filename, await fse.readFile(filePath));
    await fse.remove(filePath);
  }

  async getFileNames(): Promise<string[]> {
    return [...this.files.keys()];
  }

  stream(file: StorageFile): Readable {
    const out = new PassThrough();
    const blob = this.files.get(file.name);

    setImmediate(() => {
      if (blob === undefined) {
        out.destroy(new Error('missing blob'));
      } else {
        out.end(blob);
      }
    });

    return out;
  }
}

describe('parseStorageKeyring', () => {
  it('parses single and multi-key specs', () => {
    expect(parseStorageKeyring(`k1:${KEY_1}`)).toBeDefined();
    expect(parseStorageKeyring(`new:${KEY_2}, old:${KEY_1}`)).toBeDefined();
  });

  it('rejects invalid specs', () => {
    expect(() => parseStorageKeyring('')).toThrow(/no keys/);
    expect(() => parseStorageKeyring('missing-separator')).toThrow(
      /keyId:base64Key/,
    );
    expect(() => parseStorageKeyring('k1:tooshort')).toThrow(/32 bytes/);
    expect(() => parseStorageKeyring(`k1:${KEY_1},k1:${KEY_2}`)).toThrow(
      /duplicate/,
    );
  });
});

describe('createEncryptStream / createDecryptStream', () => {
  it(
    'round-trips data spanning multiple frames',
    { timeout: 30_000 },
    async () => {
      // Delivered as a single chunk crossing many frame boundaries: the
      // pattern that triggered silent frame loss in old ESDK versions
      // (aws-encryption-sdk-javascript#507, fixed since v2). Guards
      // against a regression sneaking in via a dependency bump.
      const data = crypto.randomBytes(1024 * 1024);

      const blob = await encrypt(data);
      await expect(decrypt(blob)).resolves.toEqual(data);
    },
  );

  it('rejects a plaintext size mismatch', async () => {
    const data = crypto.randomBytes(10_000);
    const blob = await encrypt(data);

    const short = streamToBuffer(
      createDecryptStream(
        keyring.decrypt,
        Readable.from([blob]),
        data.length - 1,
      ),
    );
    await expect(short).rejects.toThrow(/expected/);

    const exact = streamToBuffer(
      createDecryptStream(keyring.decrypt, Readable.from([blob]), data.length),
    );
    await expect(exact).resolves.toEqual(data);
  });

  it('applies the length guard to empty files', async () => {
    const empty = await encrypt(Buffer.alloc(0));
    await expect(
      streamToBuffer(
        createDecryptStream(keyring.decrypt, Readable.from([empty]), 0),
      ),
    ).resolves.toEqual(Buffer.alloc(0));

    const nonEmpty = await encrypt(Buffer.from('x'));
    await expect(
      streamToBuffer(
        createDecryptStream(keyring.decrypt, Readable.from([nonEmpty]), 0),
      ),
    ).rejects.toThrow(/expected/);
  });

  it('round-trips an empty file', async () => {
    const blob = await encrypt(Buffer.alloc(0));

    expect(blob.length).toBeGreaterThan(0);
    await expect(decrypt(blob)).resolves.toEqual(Buffer.alloc(0));
  });

  it('hides the plaintext', async () => {
    const data = Buffer.from('participant medical certificate'.repeat(100));

    const blob = await encrypt(data);

    expect(blob.includes('medical')).toBe(false);
  });

  it('decrypts with a rotated keyring that still contains the old key', async () => {
    const blob = await encrypt(Buffer.from('rotate me'));
    const rotated = parseStorageKeyring(`k2:${KEY_2},k1:${KEY_1}`);

    await expect(decrypt(blob, rotated)).resolves.toEqual(
      Buffer.from('rotate me'),
    );
  });

  it('does not let a retired key decrypt files encrypted after rotation', async () => {
    const rotated = parseStorageKeyring(`k2:${KEY_2},k1:${KEY_1}`);
    const blob = await encrypt(Buffer.from('post-rotation'), rotated);

    const retiredOnly = parseStorageKeyring(`k1:${KEY_1}`);
    await expect(decrypt(blob, retiredOnly)).rejects.toThrow();
  });

  it('fails for an unknown key id', async () => {
    const blob = await encrypt(Buffer.from('secret'));
    const other = parseStorageKeyring(`k2:${KEY_2}`);

    await expect(decrypt(blob, other)).rejects.toThrow();
  });

  it('fails when the key id matches but the key does not', async () => {
    const blob = await encrypt(Buffer.from('secret'));
    const sameIdOtherKey = parseStorageKeyring(`k1:${KEY_2}`);

    await expect(decrypt(blob, sameIdOtherKey)).rejects.toThrow();
  });

  it('fails on a tampered ciphertext byte', async () => {
    const blob = await encrypt(crypto.randomBytes(10_000));

    const tampered = Buffer.from(blob);
    tampered[tampered.length - 100] ^= 0x01;

    await expect(decrypt(tampered)).rejects.toThrow();
  });

  it('fails on truncation', async () => {
    const blob = await encrypt(crypto.randomBytes(10_000));

    await expect(decrypt(blob.subarray(0, blob.length - 20))).rejects.toThrow();
  });
});

describe('EncryptedStorage', () => {
  let tmpDir: string;
  let inner: MemoryStorage;
  let storage: EncryptedStorage;

  beforeEach(async () => {
    tmpDir = await fse.mkdtemp(path.join(os.tmpdir(), 'enc-storage-'));
    inner = new MemoryStorage(tmpDir);
    storage = new EncryptedStorage(inner, keyring, tmpDir);
  });

  afterEach(async () => {
    await fse.remove(tmpDir);
  });

  const writeTmpFile = async (name: string, data: Buffer) => {
    await fse.writeFile(path.join(tmpDir, name), data);
  };

  it('stores ciphertext in the inner driver and streams back plaintext', async () => {
    const data = crypto.randomBytes(200 * 1024);
    await writeTmpFile('file.bin', data);

    await storage.moveToStorage('file.bin');

    const blob = inner.files.get('file.bin');
    expect(blob).toBeDefined();
    expect(blob?.equals(data)).toBe(false);

    await expect(
      streamToBuffer(storage.stream(storageFile('file.bin', data.length))),
    ).resolves.toEqual(data);
  });

  it('cleans up the plaintext tmp file and staging files after the move', async () => {
    await writeTmpFile('file.bin', crypto.randomBytes(1000));

    await storage.moveToStorage('file.bin');

    await expect(fse.readdir(tmpDir)).resolves.toEqual([]);
  });

  it('re-encrypts from the untouched plaintext when the upload job is retried', async () => {
    const data = crypto.randomBytes(1000);
    await writeTmpFile('file.bin', data);

    inner.failNextMove = true;
    await expect(storage.moveToStorage('file.bin')).rejects.toThrow(
      /unavailable/,
    );

    // The plaintext source must survive a failed attempt untouched.
    await expect(fse.readFile(path.join(tmpDir, 'file.bin'))).resolves.toEqual(
      data,
    );

    await storage.moveToStorage('file.bin');

    expect(inner.moveCalls).toBe(2);
    await expect(
      streamToBuffer(storage.stream(storageFile('file.bin', data.length))),
    ).resolves.toEqual(data);
  });

  it('streams files recorded as plaintext unchanged', async () => {
    const data = crypto.randomBytes(1000);
    inner.files.set('legacy.bin', data);

    await expect(
      streamToBuffer(storage.stream(storageFile('legacy.bin', 0, null))),
    ).resolves.toEqual(data);
  });

  it('errors on an unknown encryption format', async () => {
    inner.files.set('odd.bin', crypto.randomBytes(100));

    await expect(
      streamToBuffer(storage.stream(storageFile('odd.bin', 0, 'pgp'))),
    ).rejects.toThrow(/unknown encryption format/);
  });

  it('propagates inner stream errors', async () => {
    await expect(
      streamToBuffer(storage.stream(storageFile('missing.bin'))),
    ).rejects.toThrow(/missing blob/);
  });

  it('delegates removeFile and getFileNames', async () => {
    inner.files.set('a.bin', Buffer.from('a'));

    await expect(storage.getFileNames()).resolves.toEqual(['a.bin']);
    await storage.removeFile('a.bin');
    await expect(storage.getFileNames()).resolves.toEqual([]);
  });

  describe('without a configured keyring', () => {
    let plain: EncryptedStorage;

    beforeEach(() => {
      plain = new EncryptedStorage(inner, null, tmpDir);
    });

    it('stores and streams plaintext unchanged', async () => {
      const data = crypto.randomBytes(1000);
      await writeTmpFile('file.bin', data);

      await plain.moveToStorage('file.bin');

      expect(inner.files.get('file.bin')?.equals(data)).toBe(true);
      await expect(
        streamToBuffer(plain.stream(storageFile('file.bin', 0, null))),
      ).resolves.toEqual(data);
    });

    it('refuses to serve a file recorded as encrypted', async () => {
      inner.files.set('old.bin', await encrypt(crypto.randomBytes(1000)));

      await expect(
        streamToBuffer(plain.stream(storageFile('old.bin'))),
      ).rejects.toThrow(/STORAGE_ENCRYPTION_KEYS/);
    });
  });
});

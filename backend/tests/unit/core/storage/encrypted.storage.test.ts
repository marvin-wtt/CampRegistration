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
  MAGIC,
  createDecryptStream,
  createEncryptStreams,
} from '#core/storage/encryption/envelope';
import type { Storage, StorageFile } from '#core/storage/storage';

const KEY_1 = crypto.randomBytes(32).toString('base64');
const KEY_2 = crypto.randomBytes(32).toString('base64');

const keyring = parseStorageKeyring(`k1:${KEY_1}`);

const storageFile = (name: string, size = 0): StorageFile => ({
  id: name,
  originalName: name,
  name,
  field: null,
  size,
  type: 'application/octet-stream',
  accessLevel: null,
  storageLocation: 'memory',
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
    ...createEncryptStreams(ring.encrypt),
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

  async moveToStorage(filename: string): Promise<void> {
    this.moveCalls++;
    if (this.failNextMove) {
      this.failNextMove = false;
      throw new Error('inner storage unavailable');
    }

    const filePath = path.join(this.tmpDir, filename);
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

describe('createEncryptStreams / createDecryptStream', () => {
  it(
    'round-trips data spanning multiple frames',
    { timeout: 30_000 },
    async () => {
      // Delivered as a single chunk crossing many frame boundaries: the
      // pattern that triggered silent frame loss in old ESDK versions
      // (aws-encryption-sdk-javascript#507, fixed since v2). Guards against
      // a regression sneaking in via a dependency bump.
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

  it('produces a blob that starts with the magic bytes and hides the plaintext', async () => {
    const data = Buffer.from('participant medical certificate'.repeat(100));

    const blob = await encrypt(data);

    expect(blob.subarray(0, MAGIC.length)).toEqual(MAGIC);
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

  it('passes legacy plaintext through unchanged', async () => {
    const data = crypto.randomBytes(5000);

    await expect(decrypt(data)).resolves.toEqual(data);
  });

  it('passes tiny legacy plaintext through unchanged', async () => {
    const data = Buffer.from('hi');

    await expect(decrypt(data)).resolves.toEqual(data);
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
    expect(blob?.subarray(0, MAGIC.length)).toEqual(MAGIC);
    expect(blob?.equals(data)).toBe(false);

    await expect(
      streamToBuffer(storage.stream(storageFile('file.bin', data.length))),
    ).resolves.toEqual(data);
  });

  it('does not double-encrypt when the upload job is retried', async () => {
    const data = crypto.randomBytes(1000);
    await writeTmpFile('file.bin', data);

    inner.failNextMove = true;
    await expect(storage.moveToStorage('file.bin')).rejects.toThrow(
      /unavailable/,
    );

    await storage.moveToStorage('file.bin');

    expect(inner.moveCalls).toBe(2);
    await expect(
      streamToBuffer(storage.stream(storageFile('file.bin', data.length))),
    ).resolves.toEqual(data);
  });

  it('refuses to encrypt a file that looks encrypted but has no readable key', async () => {
    // A retry may find the tmp file encrypted by an earlier attempt whose
    // key was since removed; re-encrypting it would corrupt it for good.
    const blob = await encrypt(crypto.randomBytes(1000));
    await writeTmpFile('file.bin', blob);

    const otherKeys = new EncryptedStorage(
      inner,
      parseStorageKeyring(`k2:${KEY_2}`),
      tmpDir,
    );

    await expect(otherKeys.moveToStorage('file.bin')).rejects.toThrow(
      /refusing to encrypt it again/,
    );
    expect(inner.moveCalls).toBe(0);
  });

  it('encrypts a plaintext upload that starts with the magic bytes', async () => {
    const data = Buffer.concat([MAGIC, crypto.randomBytes(500)]);
    await writeTmpFile('spoof.bin', data);

    await storage.moveToStorage('spoof.bin');

    expect(inner.files.get('spoof.bin')?.equals(data)).toBe(false);
    await expect(
      streamToBuffer(storage.stream(storageFile('spoof.bin', data.length))),
    ).resolves.toEqual(data);
  });

  it('streams files stored before encryption was enabled unchanged', async () => {
    const data = crypto.randomBytes(1000);
    inner.files.set('legacy.bin', data);

    await expect(
      streamToBuffer(storage.stream(storageFile('legacy.bin'))),
    ).resolves.toEqual(data);
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
        streamToBuffer(plain.stream(storageFile('file.bin', data.length))),
      ).resolves.toEqual(data);
    });

    it('refuses to serve a previously encrypted file as raw ciphertext', async () => {
      const blob = await encrypt(crypto.randomBytes(1000));
      inner.files.set('old.bin', blob);

      await expect(
        streamToBuffer(plain.stream(storageFile('old.bin'))),
      ).rejects.toThrow(/STORAGE_ENCRYPTION_KEYS/);
    });

    it('rejects a plaintext upload that spoofs the magic bytes', async () => {
      // Stored as-is it would be mistaken for ciphertext — and become
      // unservable — once encryption is enabled.
      await writeTmpFile(
        'spoof.bin',
        Buffer.concat([MAGIC, crypto.randomBytes(100)]),
      );

      await expect(plain.moveToStorage('spoof.bin')).rejects.toThrow(
        /magic bytes/,
      );
      expect(inner.moveCalls).toBe(0);
    });
  });
});

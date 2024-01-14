import { beforeEach, describe, expect, it } from 'vitest';
import { FileFactory, UserFactory } from '../../prisma/factories';
import config from '../../src/config';
import fse from 'fs-extra';
import path from 'path';
import { randomUUID } from 'crypto';
import { TokenFactory } from '../../prisma/factories/token';
import moment from 'moment';
import prisma from '../utils/prisma';
import { findJob, startJobs } from '../../src/jobs';

describe('jobs', () => {
  beforeEach(() => {
    startJobs();
  });

  describe('unused-file-cleanup', () => {
    it('should be scheduled', async () => {
      const job = findJob('unused-file-cleanup');

      expect(job.isRunning()).toBeTruthy();
    });

    it('should clear all uploaded files that are not used', async () => {
      const { uploadDir } = config.storage;

      const existingFileName = randomUUID() + '.pdf';
      const nonexistentFileName = randomUUID() + '.pdf';

      // Prepare files for test
      await fse.copy(
        path.join(__dirname, 'resources', 'blank.pdf'),
        path.join(uploadDir, existingFileName),
      );
      await fse.copy(
        path.join(__dirname, 'resources', 'blank.pdf'),
        path.join(uploadDir, nonexistentFileName),
      );

      // Create file entry
      await FileFactory.create({
        name: existingFileName,
      });

      await findJob('unused-file-cleanup')?.trigger();

      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fse.existsSync(path.join(uploadDir, existingFileName)),
      ).toBeTruthy();
      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fse.existsSync(path.join(uploadDir, nonexistentFileName)),
      ).toBeFalsy();
    });
  });

  describe('tmp-file-cleanup', () => {
    it('should be scheduled', async () => {
      const job = findJob('tmp-file-cleanup');

      expect(job.isRunning()).toBeTruthy();
    });

    it('should delete temporary files from storage', async () => {
      const { tmpDir } = config.storage;

      // Prepare files for test
      const fileName = randomUUID() + '.pdf';
      await fse.copy(
        path.join(__dirname, 'resources', 'blank.pdf'),
        path.join(tmpDir, fileName),
      );

      await findJob('tmp-file-cleanup')?.trigger();

      // TODO Remove
      console.log(fse.statSync(tmpDir));

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fse.existsSync(path.join(tmpDir, fileName))).toBeFalsy();
    });

    it('should keep files that where created recently', async () => {
      const { tmpDir } = config.storage;

      // Prepare files for test
      const fileName = randomUUID() + '.pdf';
      await fse.createFile(path.join(tmpDir, fileName));

      await findJob('tmp-file-cleanup')?.trigger();

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fse.existsSync(path.join(tmpDir, fileName))).toBeTruthy();
    });
  });

  describe('expired-token-cleanup', () => {
    it('should be scheduled', async () => {
      const job = findJob('expired-token-cleanup');

      expect(job.isRunning()).toBeTruthy();
    });

    it('should delete tokens that are expired', async () => {
      const validToken = await TokenFactory.create({
        user: { create: UserFactory.build() },
        expiresAt: moment().add('1', 'day').toDate(),
      });
      const expiredToken = await TokenFactory.create({
        user: { create: UserFactory.build() },
        expiresAt: moment().subtract('1', 'day').toDate(),
      });

      await findJob('expired-token-cleanup')?.trigger();

      expect(
        await prisma.token.findFirst({ where: { id: validToken.id } }),
      ).toBeDefined();
      expect(
        await prisma.token.findFirst({ where: { id: expiredToken.id } }),
      ).toBeNull();
    });
  });
});

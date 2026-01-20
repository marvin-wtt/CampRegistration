import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  FileFactory,
  RegistrationFactory,
  UserFactory,
  TokenFactory,
} from '../../../prisma/factories/index.js';
import config from '#config/index';
import fse from 'fs-extra';
import path from 'path';
import { ulid } from 'ulidx';
import moment from 'moment';
import prisma from '../utils/prisma.js';
import { findJob } from '../utils/job.js';
import { JobStatus } from '@prisma/client';

describe('jobs', () => {
  describe('unused-file-cleanup', () => {
    it('should be scheduled', async () => {
      const job = findJob('unused-file-cleanup');

      expect(job?.isRunning()).toBeTruthy();
    });

    it('should clear all uploaded files that are not used', async () => {
      const { uploadDir } = config.storage;

      const existingFileName = ulid() + '.pdf';
      const nonexistentFileName = ulid() + '.pdf';

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

  describe('unassigned-file-cleanup', () => {
    it('should be scheduled', async () => {
      const job = findJob('unassigned-file-cleanup');

      expect(job?.isRunning()).toBeTruthy();
    });

    const createFile = async (dir: string, name: string) => {
      await fse.copy(
        path.join(__dirname, 'resources', 'blank.pdf'),
        path.join(dir, name),
      );
    };

    it('should delete files that do not belong to any model', async () => {
      const { uploadDir } = config.storage;

      const date = moment().subtract(25, 'h').toDate();

      const campFileName = ulid() + '.pdf';
      await createFile(uploadDir, campFileName);
      const camp = await CampFactory.create();
      await FileFactory.create({
        name: campFileName,
        camp: { connect: { id: camp.id } },
        createdAt: date,
      });

      const registrationFileName = ulid() + '.pdf';
      await createFile(uploadDir, registrationFileName);
      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
      });
      await FileFactory.create({
        name: registrationFileName,
        registration: { connect: { id: registration.id } },
        createdAt: date,
      });

      const unassignedFileName = ulid() + '.pdf';
      await createFile(uploadDir, unassignedFileName);
      await FileFactory.create({
        name: unassignedFileName,
        createdAt: date,
      });

      const job = findJob('unassigned-file-cleanup');
      await job?.trigger();

      const fileCount = await prisma.file.count();
      expect(fileCount).toBe(2);

      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fse.existsSync(path.join(uploadDir, campFileName)),
      ).toBeTruthy();
      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fse.existsSync(path.join(uploadDir, registrationFileName)),
      ).toBeTruthy();
      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fse.existsSync(path.join(uploadDir, unassignedFileName)),
      ).toBeFalsy();
    });

    it('should not delete files that where recently deleted', async () => {
      const { uploadDir } = config.storage;

      const unassignedFileName = ulid() + '.pdf';
      await createFile(uploadDir, unassignedFileName);
      await FileFactory.create({
        name: unassignedFileName,
      });

      const job = findJob('unassigned-file-cleanup');
      await job?.trigger();

      const fileCount = await prisma.file.count();
      expect(fileCount).toBe(1);

      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fse.existsSync(path.join(uploadDir, unassignedFileName)),
      ).toBeTruthy();
    });

    it('should not delete a file from storage if it is reference by another model', async () => {
      const { uploadDir } = config.storage;

      const createdAt = moment().subtract(25, 'h').toDate();

      const fileName = ulid() + '.pdf';
      await createFile(uploadDir, fileName);
      const camp = await CampFactory.create();
      await FileFactory.create({
        name: fileName,
        camp: { connect: { id: camp.id } },
        createdAt,
      });

      await FileFactory.create({
        name: fileName,
        createdAt,
      });

      const job = findJob('unassigned-file-cleanup');
      await job?.trigger();

      const fileCount = await prisma.file.count();
      expect(fileCount).toBe(1);

      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fse.existsSync(path.join(uploadDir, fileName)),
      ).toBeTruthy();
    });
  });

  describe('tmp-file-cleanup', () => {
    it('should be scheduled', async () => {
      const job = findJob('tmp-file-cleanup');

      expect(job?.isRunning()).toBeTruthy();
    });

    it('should delete temporary files from storage', async () => {
      const { tmpDir } = config.storage;

      // Prepare files for test
      const fileName = ulid(moment().subtract(1, 'day').unix()) + '.pdf';
      await fse.copy(
        path.join(__dirname, 'resources', 'blank.pdf'),
        path.join(tmpDir, fileName),
      );

      await findJob('tmp-file-cleanup')?.trigger();

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fse.existsSync(path.join(tmpDir, fileName))).toBeFalsy();
    });

    it('should keep files that where created recently', async () => {
      const { tmpDir } = config.storage;

      // Prepare files for test
      const fileName = ulid() + '.pdf';
      await fse.createFile(path.join(tmpDir, fileName));

      await findJob('tmp-file-cleanup')?.trigger();

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fse.existsSync(path.join(tmpDir, fileName))).toBeTruthy();
    });
  });

  describe('expired-token-cleanup', () => {
    it('should be scheduled', async () => {
      const job = findJob('expired-token-cleanup');

      expect(job?.isRunning()).toBeTruthy();
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

  describe('queue-job-cleanup', () => {
    it('should be scheduled', async () => {
      const job = findJob('queue-job-cleanup');

      expect(job?.isRunning()).toBeTruthy();
    });

    it('should delete expired completed jobs', async () => {
      const jobs: { status: JobStatus; days: number }[] = [
        { status: 'PENDING', days: 1 },
        { status: 'PENDING', days: 29 },
        { status: 'PENDING', days: 31 },
        { status: 'PENDING', days: 365 },
        { status: 'RUNNING', days: 1 },
        { status: 'RUNNING', days: 29 },
        { status: 'RUNNING', days: 31 },
        { status: 'RUNNING', days: 365 },
        { status: 'COMPLETED', days: 1 },
        { status: 'COMPLETED', days: 29 },
        { status: 'COMPLETED', days: 31 }, // DELETED
        { status: 'COMPLETED', days: 365 }, // DELETED
        { status: 'FAILED', days: 1 },
        { status: 'FAILED', days: 89 },
        { status: 'FAILED', days: 91 }, // DELETED
        { status: 'FAILED', days: 365 }, // DELETED
      ];

      for (const [i, { status, days }] of jobs.entries()) {
        const executed = status === 'COMPLETED' || status === 'FAILED';

        await prisma.job.create({
          data: {
            queue: 'test-queue',
            name: `test-job-${i}`,
            status,
            createdAt: moment().subtract(32, 'days').toDate(),
            finishedAt: executed
              ? moment().subtract(days, 'days').toDate()
              : null,
            payload: {},
          },
        });
      }

      await findJob('queue-job-cleanup')?.trigger();

      const count = await prisma.job.count();
      expect(count).toBe(jobs.length - 4);
    });
  });
});

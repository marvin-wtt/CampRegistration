import { describe, expect, it } from 'vitest';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import {
  CampFactory,
  CampManagerFactory,
  FileFactory,
  RegistrationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { uploadFile, verifyFileExists } from './utils/file.js';
import { generateAccessToken } from './utils/token.js';
import { Prisma } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';
import crypto from 'crypto';
import config from '#config/index';
import { resolve } from '#core/ioc/container';
import { FileService } from '#app/file/file.service';
import fse from 'fs-extra';
import path from 'path';
import moment from 'moment';

const createCampWithManagerAndToken = async (
  campData: Partial<Prisma.CampCreateInput> = {},
  role = 'DIRECTOR',
) => {
  const camp = await CampFactory.create(campData);
  const user = await UserFactory.create();
  const manager = await CampManagerFactory.create({
    camp: { connect: { id: camp.id } },
    user: { connect: { id: user.id } },
    role,
  });
  const accessToken = generateAccessToken(user);

  return { camp, user, manager, accessToken };
};

const createCampWithFileAndToken = async (accessLevel: string = 'private') => {
  const { camp, user, manager, accessToken } =
    await createCampWithManagerAndToken();
  const fileName = crypto.randomUUID() + '.pdf';

  const file = await FileFactory.create({
    camp: { connect: { id: camp.id } },
    name: fileName,
    accessLevel,
  });

  await uploadFile('blank.pdf', fileName);

  return { camp, user, manager, file, accessToken };
};

describe('/api/v1/files/', () => {
  describe('POST /api/v1/files', () => {
    it('should respond with `201` status code when provided with file', async () => {
      const { body } = await request()
        .post('/api/v1/files/')
        .attach('file', `${__dirname}/resources/blank.pdf`)
        .expect(201);

      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('data.id');

      const id = body.data.id;

      const file = await prisma.file.findFirst({
        where: { id },
      });

      expect(file).not.toBeNull();
      expect(file?.campId).toBeNull();
      expect(file?.registrationId).toBeNull();
    });

    it('should store the file at storage', async () => {
      const { body } = await request()
        .post('/api/v1/files/')
        .attach('file', `${__dirname}/resources/blank.pdf`)
        .expect(201);

      const file = await prisma.file.findFirst({
        where: { id: body.data.id },
      });

      if (!file) {
        throw new Error('File not found');
      }

      const exists = verifyFileExists(file.name);
      expect(exists).toBe(true);
    });

    it('should set the access level to private by default', async () => {
      const { body } = await request()
        .post('/api/v1/files/')
        .attach('file', `${__dirname}/resources/blank.pdf`)
        .expect(201);

      expect(body).toHaveProperty('data.accessLevel', 'private');
    });

    it('should set the field to session id by default', async () => {
      const sessionId = crypto.randomUUID();
      const { body } = await request()
        .post('/api/v1/files/')
        .set('Cookie', ['session=' + sessionId, '__Host-session=' + sessionId])
        .attach('file', `${__dirname}/resources/blank.pdf`)
        .expect(201);

      expect(body).toHaveProperty('data.field', sessionId);
    });

    it('should respond with `400` status code when the file is missing', async () => {
      await request().post('/api/v1/files/').expect(400);
    });
  });

  describe('GET /api/v1/files/:fileId', () => {
    it('should respond with `200` status code when session id matches', async () => {
      const sessionId = crypto.randomUUID();
      const fileName = crypto.randomUUID() + '.pdf';
      const file = await FileFactory.create({
        field: sessionId,
        name: fileName,
      });

      await uploadFile('blank.pdf', fileName);

      await request()
        .get(`/api/v1/files/${file.id}`)
        .set('Cookie', ['session=' + sessionId, '__Host-session=' + sessionId])
        .send()
        .expect(200);
    });

    it('should respond with `404` status code when the physical file is missing', async () => {
      const sessionId = crypto.randomUUID();
      const file = await FileFactory.create({
        field: sessionId,
      });

      await request()
        .get(`/api/v1/files/${file.id}`)
        .set('Cookie', ['session=' + sessionId, '__Host-session=' + sessionId])
        .send()
        .expect(404);
    });

    it('should respond with `423` status code when file is temporary', async () => {
      const file = await FileFactory.create();

      await request().get(`/api/v1/files/${file.id}`).send().expect(423);
    });

    it('should respond with `200` status code when user is camp manager', async () => {
      const { file, accessToken } = await createCampWithFileAndToken();

      await request()
        .get(`/api/v1/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200);
    });

    it('should respond with `200` status code when file is public', async () => {
      const { file } = await createCampWithFileAndToken('public');

      await request().get(`/api/v1/files/${file.id}`).send().expect(200);
    });

    it('should respond with `401` status code when file is not public', async () => {
      const { file } = await createCampWithFileAndToken('private');

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { file } = await createCampWithFileAndToken();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const { file } = await createCampWithFileAndToken();

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `404` status code when the file does not exist', async () => {
      await request().get(`/api/v1/files/${ulid()}`).send().expect(404);
    });
  });

  describe('PATCH /api/v1/files/:fileId', () => {
    it('should update file metadata when user can edit camp files', async () => {
      const { file, accessToken } = await createCampWithFileAndToken();
      const originalStorageName = file.name;

      const { body } = await request()
        .patch(`/api/v1/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send({
          name: 'Updated Rules.pdf',
          field: 'rules',
          locale: 'de',
          accessLevel: 'public',
        })
        .expect(200);

      expect(body).toHaveProperty('data.id', file.id);
      expect(body).toHaveProperty('data.name', 'Updated Rules.pdf');
      expect(body).toHaveProperty('data.field', 'rules');
      expect(body).toHaveProperty('data.locale', 'de');
      expect(body).toHaveProperty('data.accessLevel', 'public');

      const updated = await prisma.file.findUnique({
        where: { id: file.id },
      });

      expect(updated).toMatchObject({
        originalName: 'Updated Rules.pdf',
        field: 'rules',
        locale: 'de',
        accessLevel: 'public',
      });
      expect(updated?.name).toBe(originalStorageName);
    });

    it('should respond with `401` when not authenticated', async () => {
      const { file } = await createCampWithFileAndToken();

      await request()
        .patch(`/api/v1/files/${file.id}`)
        .send({ name: 'Updated Rules.pdf' })
        .expect(401);
    });

    it('should respond with `403` when user lacks edit permission', async () => {
      const { file } = await createCampWithFileAndToken();
      if (!file.campId) {
        throw new Error('Camp file expected');
      }
      const counselor = await UserFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: file.campId } },
        user: { connect: { id: counselor.id } },
        role: 'COUNSELOR',
      });

      await request()
        .patch(`/api/v1/files/${file.id}`)
        .auth(generateAccessToken(counselor), { type: 'bearer' })
        .send({ name: 'Updated Rules.pdf' })
        .expect(403);
    });
  });

  describe('DELETE /api/v1/files/:fileId', () => {
    it('should respond with `204` and remove the file record', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const fileName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', fileName);

      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
        name: fileName,
      });

      await request()
        .delete(`/api/v1/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const deleted = await prisma.file.findFirst({ where: { id: file.id } });
      expect(deleted).toBeNull();
    });

    it('should delete the physical file from storage when no other references exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const fileName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', fileName);

      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
        name: fileName,
      });

      expect(verifyFileExists(fileName)).toBe(true);

      await request()
        .delete(`/api/v1/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      expect(verifyFileExists(fileName)).toBe(false);
    });

    it('should retain physical file when another record references the same name', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const fileName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', fileName);

      const file1 = await FileFactory.create({
        camp: { connect: { id: camp.id } },
        name: fileName,
      });
      // Second record referencing the same physical file name
      await FileFactory.create({ name: fileName });

      await request()
        .delete(`/api/v1/files/${file1.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      // Physical file must still exist because file2 still references it
      expect(verifyFileExists(fileName)).toBe(true);
    });

    it('should respond with `401` when not authenticated', async () => {
      const camp = await CampFactory.create();
      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request().delete(`/api/v1/files/${file.id}`).expect(401);
    });

    it('should respond with `403` when user lacks delete permission', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken(
        {},
        'COUNSELOR',
      );

      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request()
        .delete(`/api/v1/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('GET /api/v1/camps/:campId/files', () => {
    it('should respond with `200` and return camp files', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      await FileFactory.create({ camp: { connect: { id: camp.id } } });
      await FileFactory.create({ camp: { connect: { id: camp.id } } });

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/files`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(2);
    });

    it('should only return files belonging to the camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
      });
      // Unrelated file that must not be returned
      await FileFactory.create();

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/files`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toHaveProperty('id', file.id);
    });

    it('should respond with `401` when not authenticated', async () => {
      const camp = await CampFactory.create();

      await request().get(`/api/v1/camps/${camp.id}/files`).expect(401);
    });

    it('should respond with `403` when user lacks view permission', async () => {
      const camp = await CampFactory.create();
      const user = await UserFactory.create();
      // User with no camp manager role
      const accessToken = generateAccessToken(user);

      await request()
        .get(`/api/v1/camps/${camp.id}/files`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('GET /api/v1/camps/:campId/files/:fileId redirect', () => {
    it('should redirect to the file API endpoint', async () => {
      const camp = await CampFactory.create();
      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request()
        .get(`/api/v1/camps/${camp.id}/files/${file.id}`)
        .expect(302)
        .expect('Location', `/api/v1/files/${file.id}`);
    });
  });

  describe('GET /api/v1/camps/:campId/files/slots/:slot', () => {
    it('should stream the public file matching the slot without authentication', async () => {
      const camp = await CampFactory.create({ public: true });
      const fileName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', fileName);
      await FileFactory.create({
        camp: { connect: { id: camp.id } },
        field: 'rules',
        accessLevel: 'public',
        name: fileName,
      });

      await request()
        .get(`/api/v1/camps/${camp.id}/files/slots/rules`)
        .expect(200);
    });

    it('should select the locale-specific file when a locale is requested', async () => {
      const camp = await CampFactory.create({ public: true });

      const defaultName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', defaultName);
      await FileFactory.create({
        camp: { connect: { id: camp.id } },
        field: 'rules',
        locale: null,
        accessLevel: 'public',
        originalName: 'default.pdf',
        name: defaultName,
      });

      const localizedName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', localizedName);
      await FileFactory.create({
        camp: { connect: { id: camp.id } },
        field: 'rules',
        locale: 'de',
        accessLevel: 'public',
        originalName: 'localized.pdf',
        name: localizedName,
      });

      const response = await request()
        .get(`/api/v1/camps/${camp.id}/files/slots/rules?locale=de`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain(
        'localized.pdf',
      );
    });

    it('should respond with `401` when the matching file is private and the user is anonymous', async () => {
      const camp = await CampFactory.create({ public: true });
      await FileFactory.create({
        camp: { connect: { id: camp.id } },
        field: 'rules',
        accessLevel: 'private',
      });

      await request()
        .get(`/api/v1/camps/${camp.id}/files/slots/rules`)
        .expect(401);
    });

    it('should respond with `409` when the matching file is not ready', async () => {
      const camp = await CampFactory.create({ public: true });
      await FileFactory.create({
        camp: { connect: { id: camp.id } },
        field: 'rules',
        accessLevel: 'public',
        uploadStatus: 'PENDING',
      });

      await request()
        .get(`/api/v1/camps/${camp.id}/files/slots/rules`)
        .expect(409);
    });

    it('should respond with `404` when no file matches the slot', async () => {
      const camp = await CampFactory.create({ public: true });

      await request()
        .get(`/api/v1/camps/${camp.id}/files/slots/unknown`)
        .expect(404);
    });
  });
});

describe('file cleanup', () => {
  const copyResource = async (dir: string, name: string) => {
    await fse.copy(
      path.join(__dirname, 'resources', 'blank.pdf'),
      path.join(dir, name),
    );
  };

  describe('deleteUnreferencedFiles', () => {
    it('should clear all uploaded files that are not used', async () => {
      const { uploadDir } = config.storage;

      const existingFileName = ulid() + '.pdf';
      const nonexistentFileName = ulid() + '.pdf';

      // Prepare files for test
      await copyResource(uploadDir, existingFileName);
      await copyResource(uploadDir, nonexistentFileName);

      // Create file entry
      await FileFactory.create({
        name: existingFileName,
      });

      await resolve(FileService).deleteUnreferencedFiles();

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

  describe('deleteUnassignedFiles', () => {
    it('should delete files that do not belong to any model', async () => {
      const { uploadDir } = config.storage;

      const date = moment().subtract(25, 'h').toDate();

      const campFileName = ulid() + '.pdf';
      await copyResource(uploadDir, campFileName);
      const camp = await CampFactory.create();
      await FileFactory.create({
        name: campFileName,
        camp: { connect: { id: camp.id } },
        createdAt: date,
      });

      const registrationFileName = ulid() + '.pdf';
      await copyResource(uploadDir, registrationFileName);
      const registration = await RegistrationFactory.create({
        camp: { connect: { id: camp.id } },
      });
      await FileFactory.create({
        name: registrationFileName,
        registration: { connect: { id: registration.id } },
        createdAt: date,
      });

      const unassignedFileName = ulid() + '.pdf';
      await copyResource(uploadDir, unassignedFileName);
      await FileFactory.create({
        name: unassignedFileName,
        createdAt: date,
      });

      await resolve(FileService).deleteUnassignedFiles();

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
      await copyResource(uploadDir, unassignedFileName);
      await FileFactory.create({
        name: unassignedFileName,
      });

      await resolve(FileService).deleteUnassignedFiles();

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
      await copyResource(uploadDir, fileName);
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

      await resolve(FileService).deleteUnassignedFiles();

      const fileCount = await prisma.file.count();
      expect(fileCount).toBe(1);

      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fse.existsSync(path.join(uploadDir, fileName)),
      ).toBeTruthy();
    });
  });

  describe('deleteTempFiles', () => {
    it('should delete temporary files from storage', async () => {
      const { tmpDir } = config.storage;

      // Prepare files for test
      const fileName = ulid(moment().subtract(1, 'day').unix()) + '.pdf';
      await copyResource(tmpDir, fileName);

      await resolve(FileService).deleteTempFiles();

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fse.existsSync(path.join(tmpDir, fileName))).toBeFalsy();
    });

    it('should keep files that where created recently', async () => {
      const { tmpDir } = config.storage;

      // Prepare files for test
      const fileName = ulid() + '.pdf';
      await fse.createFile(path.join(tmpDir, fileName));

      await resolve(FileService).deleteTempFiles();

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fse.existsSync(path.join(tmpDir, fileName))).toBeTruthy();
    });

    it('should keep old files that still back a pending upload', async () => {
      const { tmpDir } = config.storage;

      // Old enough to be cleaned, but still the only copy of an upload whose
      // job has not completed (e.g. storage is temporarily unavailable), so it
      // must survive so the upload can recover instead of being lost.
      const fileName = ulid(moment().subtract(1, 'day').unix()) + '.pdf';
      await copyResource(tmpDir, fileName);
      await FileFactory.create({ name: fileName, uploadStatus: 'PENDING' });

      await resolve(FileService).deleteTempFiles();

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(fse.existsSync(path.join(tmpDir, fileName))).toBeTruthy();
    });
  });
});

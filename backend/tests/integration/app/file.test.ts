import { describe, expect, it } from 'vitest';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import {
  CampFactory,
  CampManagerFactory,
  FileFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { uploadFile, verifyFileExists } from './utils/file.js';
import { generateAccessToken } from './utils/token.js';
import crypto from 'crypto';

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

    it('should respond with `404` status code when file does not exist', async () => {
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
  });

  describe('DELETE /api/v1/files/:fileId', () => {
    it('should respond with `204` and remove the file record', async () => {
      const camp = await CampFactory.create();
      const user = await UserFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: user.id } },
        role: 'DIRECTOR',
      });
      const accessToken = generateAccessToken(user);

      const fileName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', fileName);

      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
        name: fileName,
      });

      await request()
        .delete(`/api/v1/camps/${camp.id}/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const deleted = await prisma.file.findFirst({ where: { id: file.id } });
      expect(deleted).toBeNull();
    });

    it('should delete the physical file from storage when no other references exist', async () => {
      const camp = await CampFactory.create();
      const user = await UserFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: user.id } },
        role: 'DIRECTOR',
      });
      const accessToken = generateAccessToken(user);

      const fileName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', fileName);

      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
        name: fileName,
      });

      expect(verifyFileExists(fileName)).toBe(true);

      await request()
        .delete(`/api/v1/camps/${camp.id}/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      expect(verifyFileExists(fileName)).toBe(false);
    });

    it('should retain physical file when another record references the same name', async () => {
      const camp = await CampFactory.create();
      const user = await UserFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: user.id } },
        role: 'DIRECTOR',
      });
      const accessToken = generateAccessToken(user);

      const fileName = crypto.randomUUID() + '.pdf';
      await uploadFile('blank.pdf', fileName);

      const file1 = await FileFactory.create({
        camp: { connect: { id: camp.id } },
        name: fileName,
      });
      // Second record referencing the same physical file name
      await FileFactory.create({ name: fileName });

      await request()
        .delete(`/api/v1/camps/${camp.id}/files/${file1.id}`)
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

      await request()
        .delete(`/api/v1/camps/${camp.id}/files/${file.id}`)
        .expect(401);
    });

    it('should respond with `403` when user lacks delete permission', async () => {
      const camp = await CampFactory.create();
      const user = await UserFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: user.id } },
        role: 'COUNSELOR',
      });
      const accessToken = generateAccessToken(user);

      const file = await FileFactory.create({
        camp: { connect: { id: camp.id } },
      });

      await request()
        .delete(`/api/v1/camps/${camp.id}/files/${file.id}`)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('GET /api/v1/camps/:campId/files', () => {
    it('should respond with `200` and return camp files', async () => {
      const camp = await CampFactory.create();
      const user = await UserFactory.create();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { connect: { id: user.id } },
        role: 'DIRECTOR',
      });
      const accessToken = generateAccessToken(user);

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

      expect(response.headers['content-disposition']).toContain('localized.pdf');
    });

    it('should respond with `403` when the matching file is private and the user is anonymous', async () => {
      const camp = await CampFactory.create({ public: true });
      await FileFactory.create({
        camp: { connect: { id: camp.id } },
        field: 'rules',
        accessLevel: 'private',
      });

      await request()
        .get(`/api/v1/camps/${camp.id}/files/slots/rules`)
        .expect(403);
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

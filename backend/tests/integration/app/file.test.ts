import { describe, expect, it } from 'vitest';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { FileFactory } from '../../../prisma/factories/index.js';
import { uploadFile, verifyFileExists } from './utils/file.js';

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
});

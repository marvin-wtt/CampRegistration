import { describe, expect, it } from 'vitest';
import { request } from '../../../tests/utils/request.js';
import prisma from '../../../tests/utils/prisma.js';

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

      expect(file.campId).toBeNull();
      expect(file.registrationId).toBeNull();
    });

    it('should set the access level to private by default', async () => {
      const { body } = await request()
        .post('/api/v1/files/')
        .attach('file', `${__dirname}/resources/blank.pdf`)
        .expect(201);

      expect(body).toHaveProperty('data.accessLevel', 'private');
    });

    it('should respond with `400` status code when the file is missing', async () => {
      await request().post('/api/v1/files/').expect(400);
    });
  });
});

describe.skip('/api/v1/camps/:campId/files/', () => {});
describe.skip('/api/v1/camps/:campId/registrations/:registrationId/files/', () => {});

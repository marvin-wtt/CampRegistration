import { describe, it } from 'vitest';
import {
  CampFactory,
  UserFactory,
  CampManagerFactory,
  RegistrationFactory,
  MessageDeliveryFactory,
  FileFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import { ulid } from 'ulidx';
import crypto from 'crypto';
import { uploadFile } from './utils/file.js';

const createCampWithManagerAndToken = async (
  campData?: Parameters<(typeof CampFactory)['create']>[0],
  role = 'DIRECTOR',
) => {
  const camp = await CampFactory.create(campData);
  const user = await UserFactory.create();
  await CampManagerFactory.create({
    camp: { connect: { id: camp.id } },
    user: { connect: { id: user.id } },
    role,
  });
  const accessToken = generateAccessToken(user);

  return { camp, user, accessToken };
};

describe('/api/v1/files/', () => {
  const createMessageDeliveryWithFile = async (role = 'DIRECTOR') => {
    const { user, accessToken, camp } = await createCampWithManagerAndToken(
      undefined,
      role,
    );
    const registration = await RegistrationFactory.create({
      camp: { connect: { id: camp.id } },
    });
    const delivery = await MessageDeliveryFactory.create({
      registration: { connect: { id: registration.id } },
    });

    const fileName = crypto.randomUUID() + '.pdf';
    await uploadFile('blank.pdf', fileName);

    const file = await FileFactory.create({
      messageDelivery: { connect: { id: delivery.id } },
      name: fileName,
    });

    return { file, user, accessToken, camp, registration, delivery };
  };

  describe('GET /api/v1/files/:fileId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { file, accessToken } = await createMessageDeliveryWithFile(role);

        await request()
          .get(`/api/v1/files/${file.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);
      },
    );

    it('should respond with `403` status code when user is not camp manager', async () => {
      const { file } = await createMessageDeliveryWithFile();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/files/${file.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const { file } = await createMessageDeliveryWithFile();

      await request().get(`/api/v1/files/${file.id}`).send().expect(401);
    });

    it('should respond with `404` status code when file id does not exists', async () => {
      const fileId = ulid();

      await request().get(`/api/v1/files/${fileId}`).send().expect(404);
    });
  });
});

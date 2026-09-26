import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  UserFactory,
  EventManagerFactory,
  RegistrationFactory,
  MessageDeliveryFactory,
  FileFactory,
  MessageTemplateFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import { ulid } from 'ulidx';
import crypto from 'crypto';
import { uploadFile } from './utils/file.js';

const createEventWithManagerAndToken = async (
  eventData?: Parameters<(typeof EventFactory)['create']>[0],
  role = 'DIRECTOR',
) => {
  const event = await EventFactory.create(eventData);
  const user = await UserFactory.create();
  await EventManagerFactory.create({
    event: { connect: { id: event.id } },
    user: { connect: { id: user.id } },
    role,
  });
  const accessToken = generateAccessToken(user);

  return { event, user, accessToken };
};

describe('/api/v1/files/', () => {
  const createMessageDeliveryWithFile = async (role = 'DIRECTOR') => {
    const { user, accessToken, event } = await createEventWithManagerAndToken(
      undefined,
      role,
    );
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
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

    return { file, user, accessToken, event, registration, delivery };
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

    it('should respond with `403` status code when user is not event manager', async () => {
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

describe('/api/v1/events/:eventId/registrations/:registrationId/messages', () => {
  it.each([
    { role: 'DIRECTOR', expectedStatus: 200 },
    { role: 'COORDINATOR', expectedStatus: 200 },
    { role: 'COUNSELOR', expectedStatus: 403 },
    { role: 'VIEWER', expectedStatus: 403 },
  ])(
    'should respond with `$expectedStatus` status code when user is $role',
    async ({ role, expectedStatus }) => {
      const { event, accessToken } = await createEventWithManagerAndToken(
        undefined,
        role,
      );
      const registration = await RegistrationFactory.create({
        event: { connect: { id: event.id } },
      });

      await request()
        .get(
          `/api/v1/events/${event.id}/registrations/${registration.id}/messages`,
        )
        .auth(accessToken, { type: 'bearer' })
        .expect(expectedStatus);
    },
  );

  it('should list only the emails of the registration with their source', async () => {
    const { event, accessToken } = await createEventWithManagerAndToken();
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
    });
    const other = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
    });
    const template = await MessageTemplateFactory.create({
      event: { connect: { id: event.id } },
      trigger: 'registration_confirmed',
    });
    await MessageDeliveryFactory.create({
      registration: { connect: { id: registration.id } },
      template: { connect: { id: template.id } },
    });
    await MessageDeliveryFactory.create({
      registration: { connect: { id: other.id } },
    });

    const { body } = await request()
      .get(
        `/api/v1/events/${event.id}/registrations/${registration.id}/messages`,
      )
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      trigger: 'registration_confirmed',
      messageId: null,
      sentBy: null,
    });
  });

  it('should respond with `404` status code when the registration belongs to another event', async () => {
    const { event, accessToken } = await createEventWithManagerAndToken();
    const registration = await RegistrationFactory.create({
      event: { create: EventFactory.build() },
    });

    await request()
      .get(
        `/api/v1/events/${event.id}/registrations/${registration.id}/messages`,
      )
      .auth(accessToken, { type: 'bearer' })
      .expect(404);
  });
});

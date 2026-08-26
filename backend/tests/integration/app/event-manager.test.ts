import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  UserFactory,
  EventManagerFactory,
  InvitationFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { ulid } from 'ulidx';

describe('/api/v1/events/:eventId/managers', () => {
  const createEventWithManagerAndToken = async (role = 'DIRECTOR') => {
    const event = await EventFactory.create();
    const user = await UserFactory.create();
    const manager = await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return {
      event,
      user,
      manager,
      accessToken,
    };
  };

  describe('GET /api/v1/events/:eventId/managers/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken, user } =
          await createEventWithManagerAndToken(role);

        const invitation = await InvitationFactory.create();
        await EventManagerFactory.create({
          event: { connect: { id: event.id } },
          invitation: { connect: { id: invitation.id } },
          role: 'DIRECTOR',
          expiresAt: new Date(Date.UTC(2030, 0)).toISOString(),
        });

        const response = await request()
          .get(`/api/v1/events/${event.id}/managers`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty('data');
          expect(response.body.data.length).toBe(2);
          expect(response.body.data[0]).toEqual({
            id: expect.anything(),
            name: user.name,
            email: user.email,
            expiresAt: null,
            status: 'ACCEPTED',
            role,
          });
          expect(response.body.data[1]).toEqual({
            id: expect.anything(),
            name: null,
            email: invitation.email,
            expiresAt: '2030-01-01T00:00:00.000Z',
            status: 'PENDING',
            role: 'DIRECTOR',
          });
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/managers`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .get(`/api/v1/events/${event.id}/managers`)
        .send()
        .expect(401);
    });
  });

  describe('GET /api/v1/events/:eventId/managers/:managerId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 200 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, manager, accessToken, user } =
          await createEventWithManagerAndToken(role);

        const response = await request()
          .get(`/api/v1/events/${event.id}/managers/${manager.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toEqual({
            id: manager.id,
            name: user.name,
            email: user.email,
            expiresAt: null,
            status: 'ACCEPTED',
            role,
          });
        }
      },
    );

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const manager = await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        invitation: { create: InvitationFactory.build() },
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const manager = await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        invitation: { create: InvitationFactory.build() },
      });

      await request()
        .get(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when manager does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const managerId = ulid();

      await request()
        .get(`/api/v1/events/${event.id}/managers/${managerId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('POST /api/v1/events/:eventId/managers/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const invited = await UserFactory.create({
          name: 'Jhon Doe',
          email: 'invited@email.net',
        });

        const response = await request()
          .post(`/api/v1/events/${event.id}/managers`)
          .send({
            email: 'invited@email.net',
            role: 'COUNSELOR',
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 201) {
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toEqual({
            id: expect.anything(),
            email: 'invited@email.net',
            name: 'Jhon Doe',
            status: 'ACCEPTED',
            expiresAt: null,
            role: 'COUNSELOR',
          });

          // Expect manager with user and without invitation
          const count = await prisma.eventManager.count({
            where: {
              eventId: event.id,
              userId: invited.id,
              invitationId: null,
            },
          });

          expect(count).toBe(1);
        }
      },
    );

    it('should respond with `201` status code when registered with expiration', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const invited = await UserFactory.create({
        name: 'Jhon Doe',
        email: 'invited@email.net',
      });

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
          expiresAt: new Date(Date.UTC(2030, 0)).toISOString(),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data');
      expect(body.data).toEqual({
        id: expect.anything(),
        email: 'invited@email.net',
        name: 'Jhon Doe',
        status: 'ACCEPTED',
        expiresAt: '2030-01-01T00:00:00.000Z',
        role: 'COUNSELOR',
      });

      // Expect manager with user and without invitation
      const count = await prisma.eventManager.count({
        where: {
          eventId: event.id,
          userId: invited.id,
          invitationId: null,
        },
      });

      expect(count).toBe(1);
    });

    it('should respond with `201` status code when invited user is not registered', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data');
      expect(body.data).toEqual({
        id: expect.anything(),
        email: 'invited@email.net',
        name: null,
        expiresAt: null,
        status: 'PENDING',
        role: 'COUNSELOR',
      });

      // Expect manager without user and with invitation
      const count = await prisma.eventManager.count({
        where: {
          eventId: event.id,
          invitation: {
            email: 'invited@email.net',
          },
          userId: null,
        },
      });

      expect(count).toBe(1);
    });

    it('should respond with `201` status code when invited with expiration', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
          expiresAt: new Date(Date.UTC(2030, 0)).toISOString(),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      expect(body).toHaveProperty('data');
      expect(body.data).toEqual({
        id: expect.anything(),
        email: 'invited@email.net',
        name: null,
        expiresAt: '2030-01-01T00:00:00.000Z',
        status: 'PENDING',
        role: 'COUNSELOR',
      });

      // Expect manager without user and with invitation
      const count = await prisma.eventManager.count({
        where: {
          eventId: event.id,
          invitation: {
            email: 'invited@email.net',
          },
          userId: null,
        },
      });

      expect(count).toBe(1);
    });

    it('should respond with `400` status code when email is invalid', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      // Invalid email
      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invalid-email',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      // No email
      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when expires at is invalid', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      // Invalid email
      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          expiresAt: 'invalid-data',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when invited is already manager', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { create: UserFactory.build({ email: 'invited@email.net' }) },
      });

      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when invited is already invited', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        invitation: {
          create: InvitationFactory.build({ email: 'invited@email.net' }),
        },
      });

      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when role is missing', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      // Invalid email
      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when role is invalid', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();

      // Invalid email
      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'INVALID',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
      const user = await UserFactory.create();
      // Manager with wrong event but correct user
      await EventManagerFactory.create({
        user: { connect: { id: user.id } },
        event: { create: EventFactory.build() },
      });
      const event = await EventFactory.create();
      // Manager with correct event but wrong user
      await EventManagerFactory.create({
        user: { create: UserFactory.build() },
        event: { connect: { id: event.id } },
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();

      await request()
        .post(`/api/v1/events/${event.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/events/:eventId/managers/:managerId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, manager, accessToken } =
          await createEventWithManagerAndToken(role);
        // A second non-expiring director so this permission-focused case
        // doesn't also trip the "must keep a director" invariant.
        await EventManagerFactory.create({
          event: { connect: { id: event.id } },
          user: { create: UserFactory.build() },
        });

        const response = await request()
          .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
          .send({
            expiresAt: new Date(Date.UTC(2030, 0)).toISOString(),
          })
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 200) {
          expect(response.body).toHaveProperty(
            'data.expiresAt',
            '2030-01-01T00:00:00.000Z',
          );
        }
      },
    );

    it('should respond with `200` status code when `expiresAt` is null', async () => {
      const { event, manager, accessToken } =
        await createEventWithManagerAndToken();

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          expiresAt: null,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.expiresAt', null);
    });

    it('should respond with `400` status code when expires at is invalid', async () => {
      const { event, accessToken, manager } =
        await createEventWithManagerAndToken();

      // Invalid email
      await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          expiresAt: 'invalid-data',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `200` status code when role is set', async () => {
      const { event, manager, accessToken } =
        await createEventWithManagerAndToken();
      // A second non-expiring director so demoting `manager` away from
      // DIRECTOR doesn't trip the "must keep a director" invariant.
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { create: UserFactory.build() },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          role: 'VIEWER',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.expiresAt', null);
    });

    it('should respond with `400` status code when demoting the sole non-expiring director', async () => {
      const { event, manager, accessToken } =
        await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          role: 'VIEWER',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const updated = await prisma.eventManager.findUniqueOrThrow({
        where: { id: manager.id },
      });
      expect(updated.role).toBe('DIRECTOR');
    });

    it('should respond with `400` status code when adding an expiration to the sole non-expiring director', async () => {
      const { event, manager, accessToken } =
        await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          expiresAt: new Date(Date.UTC(2030, 0)).toISOString(),
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const updated = await prisma.eventManager.findUniqueOrThrow({
        where: { id: manager.id },
      });
      expect(updated.expiresAt).toBeNull();
    });

    it('should respond with `200` status code when demoting a director while another non-expiring director remains', async () => {
      const { event, manager, accessToken } =
        await createEventWithManagerAndToken();
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { create: UserFactory.build() },
      });

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          role: 'VIEWER',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.role', 'VIEWER');
    });

    it('should respond with `400` status code when role is null', async () => {
      const { event, manager, accessToken } =
        await createEventWithManagerAndToken();

      await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          role: null,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when role is invalid', async () => {
      const { event, accessToken, manager } =
        await createEventWithManagerAndToken();

      // Invalid email
      await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          role: 'INVALID',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
      const user = await UserFactory.create();
      // Manager with wrong event but correct user
      await EventManagerFactory.create({
        user: { connect: { id: user.id } },
        event: { create: EventFactory.build() },
      });
      const event = await EventFactory.create();
      // Manager with correct event but wrong user
      const manager = await EventManagerFactory.create({
        user: { create: UserFactory.build() },
        event: { connect: { id: event.id } },
      });
      const accessToken = generateAccessToken(user);

      await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          email: 'invited@email.net',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `403` status code when manager expired', async () => {
      const user = await UserFactory.create();
      const event = await EventFactory.create();
      // The requesting user has an expired manager record for this event
      await EventManagerFactory.create({
        user: { connect: { id: user.id } },
        event: { connect: { id: event.id } },
        expiresAt: new Date(Date.UTC(2020, 0)).toISOString(),
      });
      // A second manager to be the target of the PATCH
      const target = await EventManagerFactory.create({
        user: { create: UserFactory.build() },
        event: { connect: { id: event.id } },
      });
      const accessToken = generateAccessToken(user);

      await request()
        .patch(`/api/v1/events/${event.id}/managers/${target.id}`)
        .send({ role: 'COUNSELOR' })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const manager = await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        invitation: { create: InvitationFactory.build() },
      });

      await request()
        .patch(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send({
          email: 'invited@email.net',
        })
        .expect(401);
    });

    it('should respond with `404` status code when manager does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const managerId = ulid();

      await request()
        .patch(`/api/v1/events/${event.id}/managers/${managerId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/events/:eventId/managers/:managerId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { event, accessToken } =
          await createEventWithManagerAndToken(role);
        const manager = await EventManagerFactory.create({
          event: { connect: { id: event.id } },
          user: { create: UserFactory.build() },
        });

        await request()
          .delete(`/api/v1/events/${event.id}/managers/${manager.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 204) {
          const count = await prisma.eventManager.count({
            where: { eventId: event.id },
          });

          expect(count).toBe(1);
        }
      },
    );

    it('should respond with `204` status code when user is event manager and status is pending', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const manager = await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        invitation: { create: InvitationFactory.build() },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const count = await prisma.eventManager.count({
        where: { eventId: event.id },
      });

      expect(count).toBe(1);
    });

    it('should respond with `400` status code when user is the last manager of a event', async () => {
      const { event, accessToken, manager } =
        await createEventWithManagerAndToken();

      await request()
        .delete(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const count = await prisma.eventManager.count({
        where: { eventId: event.id },
      });

      expect(count).toBe(1);
    });

    it('should respond with `204` status code when a manager without delete permission leaves and another director remains', async () => {
      const { event, accessToken, manager } =
        await createEventWithManagerAndToken('COORDINATOR');
      // COORDINATOR lacks `event.managers.delete`; only `eventManagerSelf`
      // should allow this request through.
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { create: UserFactory.build() },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const count = await prisma.eventManager.count({
        where: { id: manager.id },
      });
      expect(count).toBe(0);
    });

    it('should respond with `403` status code when a manager without delete permission removes someone else', async () => {
      const { event, accessToken } =
        await createEventWithManagerAndToken('COORDINATOR');
      const target = await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { create: UserFactory.build() },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/managers/${target.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `403` status code when user is not event manager', async () => {
      const event = await EventFactory.create();
      const manager = await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        invitation: { create: InvitationFactory.build() },
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const event = await EventFactory.create();
      const manager = await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        invitation: { create: InvitationFactory.build() },
      });

      await request()
        .delete(`/api/v1/events/${event.id}/managers/${manager.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when manager does not exist', async () => {
      const { event, accessToken } = await createEventWithManagerAndToken();
      const managerId = ulid();

      await request()
        .delete(`/api/v1/events/${event.id}/managers/${managerId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});

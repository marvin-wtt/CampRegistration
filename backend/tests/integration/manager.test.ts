import { describe, expect, it } from 'vitest';
import {
  CampFactory,
  UserFactory,
  CampManagerFactory,
  InvitationFactory,
} from '../../prisma/factories';
import { generateAccessToken } from '../utils/token';
import { request } from '../utils/request';
import prisma from '../utils/prisma';
import { ulid } from 'ulidx';

describe('/api/v1/camps/:campId/managers', () => {
  const createCampWithManagerAndToken = async (role = 'DIRECTOR') => {
    const camp = await CampFactory.create();
    const user = await UserFactory.create();
    const manager = await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
      role,
    });
    const accessToken = generateAccessToken(user);

    return {
      camp,
      user,
      manager,
      accessToken,
    };
  };

  describe('GET /api/v1/camps/:campId/managers/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 200 },
      { role: 'COUNSELOR', expectedStatus: 200 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken, user } =
          await createCampWithManagerAndToken(role);

        const invitation = await InvitationFactory.create();
        await CampManagerFactory.create({
          camp: { connect: { id: camp.id } },
          invitation: { connect: { id: invitation.id } },
          role: 'DIRECTOR',
          expiresAt: new Date(Date.UTC(2030, 0)).toISOString(),
        });

        const response = await request()
          .get(`/api/v1/camps/${camp.id}/managers`)
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
            status: 'accepted',
            role,
          });
          expect(response.body.data[1]).toEqual({
            id: expect.anything(),
            name: null,
            email: invitation.email,
            expiresAt: '2030-01-01T00:00:00.000Z',
            status: 'pending',
            role: 'DIRECTOR',
          });
        }
      },
    );

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/managers`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .get(`/api/v1/camps/${camp.id}/managers`)
        .send()
        .expect(401);
    });
  });

  describe('POST /api/v1/camps/:campId/managers/', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 201 },
      { role: 'COORDINATOR', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const invited = await UserFactory.create({
          name: 'Jhon Doe',
          email: 'invited@email.net',
        });

        const response = await request()
          .post(`/api/v1/camps/${camp.id}/managers`)
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
            status: 'accepted',
            expiresAt: null,
            role: 'COUNSELOR',
          });

          // Expect manager with user and without invitation
          const count = await prisma.campManager.count({
            where: {
              campId: camp.id,
              userId: invited.id,
              invitationId: null,
            },
          });

          expect(count).toBe(1);
        }
      },
    );

    it('should respond with `201` status code when registered with expiration', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const invited = await UserFactory.create({
        name: 'Jhon Doe',
        email: 'invited@email.net',
      });

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
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
        status: 'accepted',
        expiresAt: '2030-01-01T00:00:00.000Z',
        role: 'COUNSELOR',
      });

      // Expect manager with user and without invitation
      const count = await prisma.campManager.count({
        where: {
          campId: camp.id,
          userId: invited.id,
          invitationId: null,
        },
      });

      expect(count).toBe(1);
    });

    it('should respond with `201` status code when invited user is not registered', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
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
        status: 'pending',
        role: 'COUNSELOR',
      });

      // Expect manager without user and with invitation
      const count = await prisma.campManager.count({
        where: {
          campId: camp.id,
          invitation: {
            email: 'invited@email.net',
          },
          userId: null,
        },
      });

      expect(count).toBe(1);
    });

    it('should respond with `201` status code when invited with expiration', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
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
        status: 'pending',
        role: 'COUNSELOR',
      });

      // Expect manager without user and with invitation
      const count = await prisma.campManager.count({
        where: {
          campId: camp.id,
          invitation: {
            email: 'invited@email.net',
          },
          userId: null,
        },
      });

      expect(count).toBe(1);
    });

    it('should respond with `400` status code when email is invalid', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      // Invalid email
      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send({
          email: 'invalid-email',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      // No email
      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when expires at is invalid', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      // Invalid email
      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send({
          expiresAt: 'invalid-data',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when invited is already manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        user: { create: UserFactory.build({ email: 'invited@email.net' }) },
      });

      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when invited is already invited', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        invitation: {
          create: InvitationFactory.build({ email: 'invited@email.net' }),
        },
      });

      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when role is missing', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      // Invalid email
      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send({
          email: 'invited@email.net',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when role is invalid', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      // Invalid email
      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'INVALID',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const user = await UserFactory.create();
      // Manager with wrong camp but correct user
      await CampManagerFactory.create({
        user: { connect: { id: user.id } },
        camp: { create: CampFactory.build() },
      });
      const camp = await CampFactory.create();
      // Manager with correct camp but wrong user
      await CampManagerFactory.create({
        user: { create: UserFactory.build() },
        camp: { connect: { id: camp.id } },
      });
      const accessToken = generateAccessToken(user);

      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .post(`/api/v1/camps/${camp.id}/managers`)
        .send({
          email: 'invited@email.net',
          role: 'COUNSELOR',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/camps/:campId/managers/:managerId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 200 },
      { role: 'COORDINATOR', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, manager, accessToken } =
          await createCampWithManagerAndToken(role);

        const response = await request()
          .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
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
      const { camp, manager, accessToken } =
        await createCampWithManagerAndToken();

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send({
          expiresAt: null,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.expiresAt', null);
    });

    it('should respond with `400` status code when expires at is invalid', async () => {
      const { camp, accessToken, manager } =
        await createCampWithManagerAndToken();

      // Invalid email
      await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send({
          expiresAt: 'invalid-data',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `200` status code when role is set', async () => {
      const { camp, manager, accessToken } =
        await createCampWithManagerAndToken();

      const { body } = await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send({
          role: 'VIEWER',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data.expiresAt', null);
    });

    it('should respond with `400` status code when role is null', async () => {
      const { camp, manager, accessToken } =
        await createCampWithManagerAndToken();

      await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send({
          role: null,
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `400` status code when role is invalid', async () => {
      const { camp, accessToken, manager } =
        await createCampWithManagerAndToken();

      // Invalid email
      await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send({
          role: 'INVALID',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const user = await UserFactory.create();
      // Manager with wrong camp but correct user
      await CampManagerFactory.create({
        user: { connect: { id: user.id } },
        camp: { create: CampFactory.build() },
      });
      const camp = await CampFactory.create();
      // Manager with correct camp but wrong user
      const manager = await CampManagerFactory.create({
        user: { create: UserFactory.build() },
        camp: { connect: { id: camp.id } },
      });
      const accessToken = generateAccessToken(user);

      await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send({
          email: 'invited@email.net',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `403` status code when manager expired', async () => {
      const user = await UserFactory.create();
      const camp = await CampFactory.create();
      // Manager with correct camp but wrong user
      const manager = await CampManagerFactory.create({
        user: { create: UserFactory.build() },
        camp: { connect: { id: camp.id } },
        expiresAt: new Date(Date.UTC(2020, 0)).toISOString(),
      });
      const accessToken = generateAccessToken(user);

      await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send({
          email: 'invited@email.net',
        })
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const manager = await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        invitation: { create: InvitationFactory.build() },
      });

      await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send({
          email: 'invited@email.net',
        })
        .expect(401);
    });

    it('should respond with `404` status code when manager does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const managerId = ulid();

      await request()
        .patch(`/api/v1/camps/${camp.id}/managers/${managerId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/camps/:campId/managers/:managerId', () => {
    it.each([
      { role: 'DIRECTOR', expectedStatus: 204 },
      { role: 'COORDINATOR', expectedStatus: 403 },
      { role: 'COUNSELOR', expectedStatus: 403 },
      { role: 'VIEWER', expectedStatus: 403 },
    ])(
      'should respond with `$expectedStatus` status code when user is $role',
      async ({ role, expectedStatus }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken(role);
        const manager = await CampManagerFactory.create({
          camp: { connect: { id: camp.id } },
          user: { create: UserFactory.build() },
        });

        await request()
          .delete(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
          .send()
          .auth(accessToken, { type: 'bearer' })
          .expect(expectedStatus);

        if (expectedStatus === 204) {
          const count = await prisma.campManager.count({
            where: { campId: camp.id },
          });

          expect(count).toBe(1);
        }
      },
    );

    it('should respond with `204` status code when user is camp manager and status is pending', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const manager = await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        invitation: { create: InvitationFactory.build() },
      });

      await request()
        .delete(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(204);

      const count = await prisma.campManager.count({
        where: { campId: camp.id },
      });

      expect(count).toBe(1);
    });

    it('should respond with `400` status code when user is the last manager of a camp', async () => {
      const { camp, accessToken, manager } =
        await createCampWithManagerAndToken();

      await request()
        .delete(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const count = await prisma.campManager.count({
        where: { campId: camp.id },
      });

      expect(count).toBe(1);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const manager = await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        invitation: { create: InvitationFactory.build() },
      });
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .delete(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const manager = await CampManagerFactory.create({
        camp: { connect: { id: camp.id } },
        invitation: { create: InvitationFactory.build() },
      });

      await request()
        .delete(`/api/v1/camps/${camp.id}/managers/${manager.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when manager does not exist', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const managerId = ulid();

      await request()
        .delete(`/api/v1/camps/${camp.id}/managers/${managerId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });
});

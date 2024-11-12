import { describe, expect, it } from 'vitest';
import { request } from '../utils/request';
import {
  CampFactory,
  CampManagerFactory,
  UserFactory,
} from '../../prisma/factories';
import { generateAccessToken } from '../utils/token';
import { Camp } from '@prisma/client';
import { ExpenseFactory } from '../../prisma/factories/expense';
import { ulid } from 'ulidx';
import {
  expenseCreateRequestData,
  expenseMinimal,
} from '../fixtures/expense/expense.fixture';
import prisma from '../utils/prisma';

const createCampWithManagerAndToken = async () => {
  const camp = await CampFactory.create();
  const user = await UserFactory.create();
  const manager = await CampManagerFactory.create({
    camp: { connect: { id: camp.id } },
    user: { connect: { id: user.id } },
  });
  const accessToken = generateAccessToken(user);

  return {
    camp,
    user,
    manager,
    accessToken,
  };
};

const createExpenseWithCamp = async (camp: Camp) => {
  return ExpenseFactory.create({
    camp: { connect: { id: camp.id } },
  });
};

describe('/api/v1/camps/:campId/expenses/', () => {
  describe('GET /api/v1/camps/:campId/expenses/', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      await createExpenseWithCamp(camp);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/expenses`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toHaveProperty('id');
      expect(body.data[0]).toHaveProperty('receiptNumber');
      expect(body.data[0]).toHaveProperty('name');
      expect(body.data[0]).toHaveProperty('description');
      expect(body.data[0]).toHaveProperty('category');
      expect(body.data[0]).toHaveProperty('amount');
      expect(body.data[0]).toHaveProperty('date');
      expect(body.data[0]).toHaveProperty('paidAt');
      expect(body.data[0]).toHaveProperty('paidBy');
      expect(body.data[0]).toHaveProperty('payee');
      expect(body.data[0]).toHaveProperty('file');
    });

    it('should respond with `403` status code when user is not camp manager of this camp', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/expenses`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/expenses`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request().get(`/api/v1/camps/${camp.id}/rooms`).send().expect(401);
    });
  });

  describe('GET /api/v1/camps/:campId/expenses/:expenseId', () => {
    it('should respond with `200` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const expense = await createExpenseWithCamp(camp);

      const { body } = await request()
        .get(`/api/v1/camps/${camp.id}/expenses/${expense.id}/`)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('receiptNumber');
      expect(body.data).toHaveProperty('name');
      expect(body.data).toHaveProperty('description');
      expect(body.data).toHaveProperty('category');
      expect(body.data).toHaveProperty('amount');
      expect(body.data).toHaveProperty('date');
      expect(body.data).toHaveProperty('paidAt');
      expect(body.data).toHaveProperty('paidBy');
      expect(body.data).toHaveProperty('payee');
      expect(body.data).toHaveProperty('file');
    });

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());
      const expense = await createExpenseWithCamp(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/expenses/${expense.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();
      const expense = await createExpenseWithCamp(camp);

      await request()
        .get(`/api/v1/camps/${camp.id}/expenses/${expense.id}`)
        .send()
        .expect(401);
    });

    it('should respond with `404` status code when camp id does not exists', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const expenseId = ulid();

      await request()
        .get(`/api/v1/camps/${camp.id}/expenses/${expenseId}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });

    it('should respond with `404` status code when expense does not belong to the camp', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();
      const expense = await createExpenseWithCamp(await CampFactory.create());

      await request()
        .get(`/api/v1/camps/${camp.id}/expenses/${expense.id}`)
        .send()
        .auth(accessToken, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('POST /api/v1/camps/:campId/expenses/', () => {
    it('should respond with `201` status code when user is camp manager', async () => {
      const { camp, accessToken } = await createCampWithManagerAndToken();

      const { body } = await request()
        .post(`/api/v1/camps/${camp.id}/expenses/`)
        .send(expenseMinimal)
        .auth(accessToken, { type: 'bearer' })
        .expect(201);

      const roomCount = await prisma.expense.count();
      expect(roomCount).toBe(1);

      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('id');
    });

    it.each(expenseCreateRequestData)(
      'should validate the request body | $name',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async ({ data, statusCode }) => {
        const { camp, accessToken } = await createCampWithManagerAndToken();

        await request()
          .post(`/api/v1/camps/${camp.id}/expenses/`)
          .send(data)
          .auth(accessToken, { type: 'bearer' })
          .expectOrPrint(statusCode);
      },
    );

    it.todo('should respond with `201` status code when file is provided');

    it('should respond with `403` status code when user is not camp manager', async () => {
      const camp = await CampFactory.create();
      const accessToken = generateAccessToken(await UserFactory.create());

      await request()
        .post(`/api/v1/camps/${camp.id}/expenses/`)
        .send(expenseMinimal)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const count = await prisma.expense.count();
      expect(count).toBe(0);
    });

    it('should respond with `401` status code when unauthenticated', async () => {
      const camp = await CampFactory.create();

      await request()
        .post(`/api/v1/camps/${camp.id}/expenses/`)
        .send(expenseMinimal)
        .expect(401);

      const count = await prisma.expense.count();
      expect(count).toBe(0);
    });
  });

  describe('PATCH /api/v1/camps/:campId/expenses/:expenseId', () => {});

  describe('DELETE /api/v1/camps/:campId/expenses/:expenseId', () => {});
});

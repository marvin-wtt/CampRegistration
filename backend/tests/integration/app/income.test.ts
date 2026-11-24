import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import type { Event } from '#generated/prisma/client.js';

describe('income', () => {
  const addManager = async (event: Event, role: string) => {
    const user = await UserFactory.create();
    await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });

    return { user, token: generateAccessToken(user) };
  };

  const setup = async (role = 'TREASURER') => {
    const event = await EventFactory.create();
    const { user, token } = await addManager(event, role);

    return { event, user, token };
  };

  const createIncome = async (
    event: Event,
    token: string,
    data: Record<string, unknown> = {},
  ) => {
    const { body } = await request()
      .post(`/api/v1/events/${event.id}/incomes`)
      .send({ amount: 300000, description: 'State youth grant', ...data })
      .auth(token, { type: 'bearer' })
      .expect(201);

    return body.data as { id: string; number: number; label: string };
  };

  it('numbers income per event with its prefix, never reusing a number', async () => {
    const { event, token } = await setup();

    const first = await createIncome(event, token);
    const second = await createIncome(event, token);
    await request()
      .delete(`/api/v1/events/${event.id}/incomes/${second.id}`)
      .auth(token, { type: 'bearer' })
      .expect(204);
    const third = await createIncome(event, token);

    expect([first, second, third].map((i) => i.label)).toEqual([
      'I1',
      'I2',
      'I3',
    ]);
  });

  it('keeps promised and received income apart in the summary', async () => {
    const { event, token } = await setup();

    await createIncome(event, token, { receivedOn: '2026-06-01' });
    await createIncome(event, token, { amount: 50000, receivedOn: null });

    const { body } = await request()
      .get(`/api/v1/events/${event.id}/finances/summary`)
      .auth(token, { type: 'bearer' })
      .expect(200);

    expect(body.data).toMatchObject({
      incomeReceived: 300000,
      incomeExpected: 50000,
      result: 300000,
    });
  });

  it('files income only under an income category', async () => {
    const { event, token } = await setup();
    const expenseCategory = await prisma.financeCategory.create({
      data: { eventId: event.id, kind: 'EXPENSE', name: 'Food' },
    });
    const grants = await prisma.financeCategory.create({
      data: { eventId: event.id, kind: 'INCOME', name: 'Grants' },
    });

    await request()
      .post(`/api/v1/events/${event.id}/incomes`)
      .send({
        amount: 1000,
        description: 'Grant',
        categoryId: expenseCategory.id,
      })
      .auth(token, { type: 'bearer' })
      .expect(400);

    const income = await createIncome(event, token, { categoryId: grants.id });

    // A used category can't be deleted, only archived.
    await request()
      .delete(`/api/v1/events/${event.id}/finance-categories/${grants.id}`)
      .auth(token, { type: 'bearer' })
      .expect(409);
    expect(income.label).toBe('I1');
  });

  it('fixes the prefix once an income exists', async () => {
    const { event, token } = await setup('DIRECTOR');

    await request()
      .patch(`/api/v1/events/${event.id}/finances/settings`)
      .send({ incomeNumberPrefix: 'E' })
      .auth(token, { type: 'bearer' })
      .expect(200);
    const income = await createIncome(event, token);
    expect(income.label).toBe('E1');

    const { body } = await request()
      .patch(`/api/v1/events/${event.id}/finances/settings`)
      .send({ incomeNumberPrefix: 'I' })
      .auth(token, { type: 'bearer' })
      .expect(409);
    expect(body.errorCode).toBe('INCOME_PREFIX_LOCKED');
  });

  it('lets only directors and treasurers record income', async () => {
    const { event } = await setup();
    const coordinator = await addManager(event, 'COORDINATOR');

    await request()
      .post(`/api/v1/events/${event.id}/incomes`)
      .send({ amount: 1000, description: 'Donation' })
      .auth(coordinator.token, { type: 'bearer' })
      .expect(403);
    await request()
      .get(`/api/v1/events/${event.id}/incomes`)
      .auth(coordinator.token, { type: 'bearer' })
      .expect(403);
  });
});

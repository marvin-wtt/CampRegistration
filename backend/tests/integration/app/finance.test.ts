import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
  EventFactory,
  EventManagerFactory,
  FileFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';
import prisma from '../utils/prisma.js';
import { generateAccessToken } from './utils/token.js';
import type { Event } from '#generated/prisma/client.js';

describe('finances', () => {
  const addManager = async (event: Event, role: string) => {
    const user = await UserFactory.create();
    await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });

    return { user, token: generateAccessToken(user) };
  };

  const setup = async (role = 'DIRECTOR') => {
    const event = await EventFactory.create();
    const { user, token } = await addManager(event, role);

    return { event, user, token };
  };

  const expense = (data: Record<string, unknown> = {}) => ({
    amount: 4780,
    date: '2026-07-27',
    description: 'Ice cream',
    ...data,
  });

  const createExpense = async (
    event: Event,
    token: string,
    data: Record<string, unknown> = {},
  ) => {
    const { body } = await request()
      .post(`/api/v1/events/${event.id}/expenses`)
      .send(expense(data))
      .auth(token, { type: 'bearer' })
      .expect(201);

    return body.data as { id: string; receiptNumber: number };
  };

  describe('receipt numbers', () => {
    it('counts up per event and never reuses a deleted number', async () => {
      const { event, token } = await setup();
      const other = await setup();

      const first = await createExpense(event, token);
      const second = await createExpense(event, token);
      await createExpense(other.event, other.token);

      await request()
        .delete(`/api/v1/events/${event.id}/expenses/${second.id}`)
        .auth(token, { type: 'bearer' })
        .expect(204);

      const third = await createExpense(event, token);

      expect([first, second, third].map((e) => e.receiptNumber)).toEqual([
        1, 2, 3,
      ]);
    });

    it('does not change the event when handing out a number', async () => {
      const { event, token } = await setup();

      await createExpense(event, token);

      const after = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
      });
      expect(after.updatedAt).toEqual(event.updatedAt);
      expect(after.lastReceiptNumber).toBe(1);
    });
  });

  describe('expenses', () => {
    it.each([
      { role: 'DIRECTOR', status: 201 },
      { role: 'COORDINATOR', status: 201 },
      { role: 'TREASURER', status: 201 },
      { role: 'COUNSELOR', status: 201 },
      { role: 'VIEWER', status: 403 },
    ])('lets $role record an expense: $status', async ({ role, status }) => {
      const { event, token } = await setup(role);

      await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense())
        .auth(token, { type: 'bearer' })
        .expect(status);
    });

    it('snapshots a manager payer and refuses someone outside the event', async () => {
      const { event, user, token } = await setup();
      const stranger = await UserFactory.create();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense({ paidByUserId: user.id, paidByName: 'ignored' }))
        .auth(token, { type: 'bearer' })
        .expect(201);
      expect(body.data.paidByName).toBe(user.name);

      await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense({ paidByUserId: stranger.id }))
        .auth(token, { type: 'bearer' })
        .expect(400);
    });

    it('keeps a free-text payer and treats no payer as event funds', async () => {
      const { event, token } = await setup();

      const club = await createExpense(event, token, { paidByName: ' Club ' });
      const funds = await createExpense(event, token);

      const rows = await prisma.expense.findMany({
        where: { id: { in: [club.id, funds.id] } },
        orderBy: { receiptNumber: 'asc' },
      });
      expect(rows.map((r) => [r.paidByUserId, r.paidByName])).toEqual([
        [null, 'Club'],
        [null, null],
      ]);
    });

    it('takes an expense whose receipt is still to come', async () => {
      const { event, token } = await setup();

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense({ date: null }))
        .auth(token, { type: 'bearer' })
        .expect(201);
      expect(body.data.date).toBeNull();

      const { body: summary } = await request()
        .get(`/api/v1/events/${event.id}/finances/summary`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(summary.data.receiptsPending).toEqual([body.data.receiptNumber]);
      // Still counted: the amount is expected all the same.
      expect(summary.data.total).toBe(4780);

      const { body: dated } = await request()
        .patch(`/api/v1/events/${event.id}/expenses/${body.data.id}`)
        .send({ date: '2026-07-30' })
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(dated.data.date).toBe('2026-07-30');

      // And back: the receipt turned out not to be the right one.
      const { body: cleared } = await request()
        .patch(`/api/v1/events/${event.id}/expenses/${body.data.id}`)
        .send({ date: null })
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(cleared.data.date).toBeNull();
    });

    it('requires the original amount and currency together', async () => {
      const { event, token } = await setup();

      await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense({ originalAmount: 20000 }))
        .auth(token, { type: 'bearer' })
        .expect(400);

      await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense({ originalAmount: 20000, originalCurrency: 'PLN' }))
        .auth(token, { type: 'bearer' })
        .expect(201);
    });

    it('attaches several receipt files and syncs them on update', async () => {
      const { event, token } = await setup();
      const sessionId = crypto.randomUUID();
      const [a, b] = await Promise.all([
        FileFactory.create({ field: sessionId }),
        FileFactory.create({ field: sessionId }),
      ]);

      const { body } = await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense({ fileIds: [a.id, b.id] }))
        .setSessionId(sessionId)
        .auth(token, { type: 'bearer' })
        .expect(201);
      expect(body.data.files).toHaveLength(2);

      const { body: updated } = await request()
        .patch(`/api/v1/events/${event.id}/expenses/${body.data.id}`)
        .send({ fileIds: [a.id] })
        .setSessionId(sessionId)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(updated.data.files.map((f: { id: string }) => f.id)).toEqual([
        a.id,
      ]);
    });

    it('writes the audit log', async () => {
      const { event, token } = await setup();

      const created = await createExpense(event, token);

      const entries = await prisma.auditLog.findMany({
        where: { entityType: 'expense', entityId: created.id },
      });
      expect(entries).toHaveLength(1);
      expect(entries[0]?.details).toMatchObject({
        context: { receiptNumber: 1, amount: 4780 },
      });
    });
  });

  describe('own expenses', () => {
    it('shows a counselor only what they recorded or paid', async () => {
      const { event, token: director } = await setup();
      const counselor = await addManager(event, 'COUNSELOR');

      const own = await createExpense(event, counselor.token);
      const paidForThem = await createExpense(event, director, {
        paidByUserId: counselor.user.id,
      });
      const others = await createExpense(event, director);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/expenses?view=own`)
        .auth(counselor.token, { type: 'bearer' })
        .expect(200);
      expect(body.data.map((e: { id: string }) => e.id)).toEqual([
        own.id,
        paidForThem.id,
      ]);

      await request()
        .get(`/api/v1/events/${event.id}/expenses/${others.id}`)
        .auth(counselor.token, { type: 'bearer' })
        .expect(403);
    });

    it('refuses a counselor every list with view=all', async () => {
      const { event } = await setup();
      const counselor = await addManager(event, 'COUNSELOR');

      for (const path of ['expenses', 'payouts', 'finances/balances']) {
        await request()
          .get(`/api/v1/events/${event.id}/${path}?view=all`)
          .auth(counselor.token, { type: 'bearer' })
          .expect(403);
      }
    });

    it('lists only own records when no view is requested', async () => {
      const { event, token: director } = await setup();
      const counselor = await addManager(event, 'COUNSELOR');

      const mine = await createExpense(event, director);
      await createExpense(event, counselor.token);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/expenses`)
        .auth(director, { type: 'bearer' })
        .expect(200);
      expect(body.data.map((e: { id: string }) => e.id)).toEqual([mine.id]);
    });

    it('flags which records the requester owns', async () => {
      const { event, token: director } = await setup();
      const counselor = await addManager(event, 'COUNSELOR');

      const own = await createExpense(event, counselor.token);
      await createExpense(event, director);

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/expenses?view=all`)
        .auth(director, { type: 'bearer' })
        .expect(200);
      const owned = Object.fromEntries(
        body.data.map((e: { id: string; owned: boolean }) => [e.id, e.owned]),
      );
      expect(Object.values(owned).filter(Boolean)).toHaveLength(1);
      expect(owned[own.id]).toBe(false);
    });

    it('lets a counselor edit and delete only their own', async () => {
      const { event, token: director } = await setup();
      const counselor = await addManager(event, 'COUNSELOR');

      const own = await createExpense(event, counselor.token);
      const others = await createExpense(event, director);

      await request()
        .patch(`/api/v1/events/${event.id}/expenses/${own.id}`)
        .send({ amount: 5000 })
        .auth(counselor.token, { type: 'bearer' })
        .expect(200);
      await request()
        .patch(`/api/v1/events/${event.id}/expenses/${others.id}`)
        .send({ amount: 5000 })
        .auth(counselor.token, { type: 'bearer' })
        .expect(403);
      await request()
        .delete(`/api/v1/events/${event.id}/expenses/${own.id}`)
        .auth(counselor.token, { type: 'bearer' })
        .expect(204);
    });

    it('shows a counselor only their own balance', async () => {
      const { event, token: director } = await setup();
      const counselor = await addManager(event, 'COUNSELOR');
      const other = await addManager(event, 'COUNSELOR');

      await createExpense(event, director, { paidByUserId: counselor.user.id });
      await createExpense(event, director, { paidByUserId: other.user.id });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/finances/balances?view=own`)
        .auth(counselor.token, { type: 'bearer' })
        .expect(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].userId).toBe(counselor.user.id);

      await request()
        .get(`/api/v1/events/${event.id}/finances/summary`)
        .auth(counselor.token, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('categories', () => {
    const createCategory = async (
      event: Event,
      token: string,
      data: Record<string, unknown>,
      status = 201,
    ) => {
      const { body } = await request()
        .post(`/api/v1/events/${event.id}/expense-categories`)
        .send(data)
        .auth(token, { type: 'bearer' })
        .expect(status);

      return body.data as { id: string };
    };

    it('lets only directors and treasurers configure them', async () => {
      for (const [role, status] of [
        ['DIRECTOR', 201],
        ['TREASURER', 201],
        ['COORDINATOR', 403],
        ['COUNSELOR', 403],
      ] as const) {
        const { event, token } = await setup(role);
        await createCategory(event, token, { name: 'Food' }, status);
      }
    });

    it('groups one level deep and files expenses under leaves only', async () => {
      const { event, token } = await setup();
      const group = await createCategory(event, token, { name: 'Eligible' });
      const food = await createCategory(event, token, {
        name: 'Food',
        parentId: group.id,
      });

      await createCategory(
        event,
        token,
        { name: 'Snacks', parentId: food.id },
        400,
      );
      await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense({ categoryId: group.id }))
        .auth(token, { type: 'bearer' })
        .expect(400);
      await createExpense(event, token, { categoryId: food.id });
    });

    it('archives a used category instead of deleting it', async () => {
      const { event, token } = await setup();
      const food = await createCategory(event, token, { name: 'Food' });
      await createExpense(event, token, { categoryId: food.id });

      await request()
        .delete(`/api/v1/events/${event.id}/expense-categories/${food.id}`)
        .auth(token, { type: 'bearer' })
        .expect(409);
      await request()
        .patch(`/api/v1/events/${event.id}/expense-categories/${food.id}`)
        .send({ archived: true })
        .auth(token, { type: 'bearer' })
        .expect(200);
      await request()
        .post(`/api/v1/events/${event.id}/expenses`)
        .send(expense({ categoryId: food.id }))
        .auth(token, { type: 'bearer' })
        .expect(400);
    });

    it('reorders and regroups in one request', async () => {
      const { event, token } = await setup();
      const group = await createCategory(event, token, { name: 'Group' });
      const travel = await createCategory(event, token, { name: 'Travel' });

      const { body } = await request()
        .put(`/api/v1/events/${event.id}/expense-categories/order`)
        .send({
          items: [
            { id: group.id, parentId: null, position: 0 },
            { id: travel.id, parentId: group.id, position: 0 },
          ],
        })
        .auth(token, { type: 'bearer' })
        .expect(200);

      const moved = body.data.find((c: { id: string }) => c.id === travel.id);
      expect(moved.parentId).toBe(group.id);
    });
  });

  describe('payouts and balances', () => {
    it('numbers payouts with the prefix and settles a balance', async () => {
      const { event, user, token } = await setup('TREASURER');

      await createExpense(event, token, {
        amount: 113345,
        paidByUserId: user.id,
      });
      const { body: payout } = await request()
        .post(`/api/v1/events/${event.id}/payouts`)
        .send({
          recipientUserId: user.id,
          direction: 'OUT',
          amount: 60000,
          paidOn: '2026-07-24',
        })
        .auth(token, { type: 'bearer' })
        .expect(201);
      expect(payout.data.label).toBe('P1');

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/finances/balances?view=all`)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(body.data).toEqual([
        expect.objectContaining({
          userId: user.id,
          paid: 113345,
          paidOut: 60000,
          balance: 53345,
        }),
      ]);
    });

    it('settles a balance only once the payout is paid', async () => {
      const { event, user, token } = await setup('TREASURER');
      await createExpense(event, token, {
        amount: 8865,
        paidByUserId: user.id,
      });

      const { body: payout } = await request()
        .post(`/api/v1/events/${event.id}/payouts`)
        .send({ recipientUserId: user.id, direction: 'OUT', amount: 8865 })
        .auth(token, { type: 'bearer' })
        .expect(201);
      expect(payout.data.paidOn).toBeNull();
      expect(payout.data.createdByName).toBe(user.name);

      const balances = async () =>
        (
          await request()
            .get(`/api/v1/events/${event.id}/finances/balances?view=all`)
            .auth(token, { type: 'bearer' })
            .expect(200)
        ).body.data[0];

      expect(await balances()).toMatchObject({
        balance: 8865,
        toPay: 8865,
        open: 0,
      });

      await request()
        .patch(`/api/v1/events/${event.id}/payouts/${payout.data.id}`)
        .send({ paidOn: '2026-07-30' })
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(await balances()).toMatchObject({ balance: 0, toPay: 0 });
    });

    describe('signature', () => {
      const SIGNATURE = 'M10 20 L30 40 Q50 60 70 40';

      const createPayout = async (
        event: Event,
        token: string,
        recipientUserId: string,
      ) => {
        const { body } = await request()
          .post(`/api/v1/events/${event.id}/payouts`)
          .send({
            recipientUserId,
            direction: 'OUT',
            amount: 8865,
            paidOn: '2026-07-28',
          })
          .auth(token, { type: 'bearer' })
          .expect(201);
        return body.data as { id: string };
      };

      it('is signed on the treasurer’s device and by the recipient only', async () => {
        const { event, token } = await setup('TREASURER');
        const counselor = await addManager(event, 'COUNSELOR');
        const other = await addManager(event, 'COUNSELOR');
        const payout = await createPayout(event, token, counselor.user.id);
        const url = `/api/v1/events/${event.id}/payouts/${payout.id}/signature`;

        await request()
          .put(url)
          .send({ signature: SIGNATURE })
          .auth(other.token, { type: 'bearer' })
          .expect(403);

        const { body } = await request()
          .put(url)
          .send({ signature: SIGNATURE })
          .auth(counselor.token, { type: 'bearer' })
          .expect(200);
        expect(body.data.signature).toBe(SIGNATURE);
        expect(body.data.signedAt).not.toBeNull();

        await request()
          .put(url)
          .send({ signature: SIGNATURE })
          .auth(token, { type: 'bearer' })
          .expect(200);
      });

      it('is removed by the treasurer only', async () => {
        const { event, token } = await setup('TREASURER');
        const counselor = await addManager(event, 'COUNSELOR');
        const payout = await createPayout(event, token, counselor.user.id);
        const url = `/api/v1/events/${event.id}/payouts/${payout.id}/signature`;
        await request()
          .put(url)
          .send({ signature: SIGNATURE })
          .auth(counselor.token, { type: 'bearer' })
          .expect(200);

        await request()
          .delete(url)
          .auth(counselor.token, { type: 'bearer' })
          .expect(403);

        const { body } = await request()
          .delete(url)
          .auth(token, { type: 'bearer' })
          .expect(200);
        expect(body.data.signature).toBeNull();
        expect(body.data.signedAt).toBeNull();
      });

      it('refuses anything but path data', async () => {
        const { event, user, token } = await setup();
        const payout = await createPayout(event, token, user.id);

        await request()
          .put(`/api/v1/events/${event.id}/payouts/${payout.id}/signature`)
          .send({ signature: '<script>alert(1)</script>' })
          .auth(token, { type: 'bearer' })
          .expect(400);
      });

      it('is cleared when the amount changes, kept for a note', async () => {
        const { event, user, token } = await setup();
        const payout = await createPayout(event, token, user.id);
        const url = `/api/v1/events/${event.id}/payouts/${payout.id}`;
        await request()
          .put(`${url}/signature`)
          .send({ signature: SIGNATURE })
          .auth(token, { type: 'bearer' })
          .expect(200);

        const { body: noted } = await request()
          .patch(url)
          .send({ note: 'Cash' })
          .auth(token, { type: 'bearer' })
          .expect(200);
        expect(noted.data.signature).toBe(SIGNATURE);

        const { body: changed } = await request()
          .patch(url)
          .send({ amount: 9000 })
          .auth(token, { type: 'bearer' })
          .expect(200);
        expect(changed.data.signature).toBeNull();
        expect(changed.data.signedAt).toBeNull();
      });
    });

    it('refuses a payout without a recipient', async () => {
      const { event, token } = await setup();

      await request()
        .post(`/api/v1/events/${event.id}/payouts`)
        .send({ direction: 'OUT', amount: 100, paidOn: '2026-07-24' })
        .auth(token, { type: 'bearer' })
        .expect(400);
    });

    it.each([
      { role: 'COORDINATOR', status: 201 },
      { role: 'COUNSELOR', status: 403 },
    ])('lets $role record payouts: $status', async ({ role, status }) => {
      const { event, token } = await setup(role);

      await request()
        .post(`/api/v1/events/${event.id}/payouts`)
        .send({
          recipientName: 'Tomasz',
          direction: 'OUT',
          amount: 25000,
          paidOn: '2026-07-20',
        })
        .auth(token, { type: 'bearer' })
        .expect(status);
    });

    it('fixes the prefix once the first payout exists', async () => {
      const { event, token } = await setup();

      await request()
        .patch(`/api/v1/events/${event.id}/finances/settings`)
        .send({ payoutNumberPrefix: 'A' })
        .auth(token, { type: 'bearer' })
        .expect(200);

      const { body: payout } = await request()
        .post(`/api/v1/events/${event.id}/payouts`)
        .send({
          recipientName: 'Marie',
          direction: 'OUT',
          amount: 8865,
          paidOn: '2026-07-28',
        })
        .auth(token, { type: 'bearer' })
        .expect(201);
      expect(payout.data.label).toBe('A1');

      await request()
        .delete(`/api/v1/events/${event.id}/payouts/${payout.data.id}`)
        .auth(token, { type: 'bearer' })
        .expect(204);

      const { body } = await request()
        .patch(`/api/v1/events/${event.id}/finances/settings`)
        .send({ payoutNumberPrefix: 'P' })
        .auth(token, { type: 'bearer' })
        .expect(409);
      expect(body.errorCode).toBe('PAYOUT_PREFIX_LOCKED');
    });
  });

  describe('summary', () => {
    it('nets refunds and splits what people and event funds paid', async () => {
      const { event, user, token } = await setup();

      await createExpense(event, token, { amount: 50000 });
      await createExpense(event, token, { type: 'REFUND', amount: 50000 });
      await createExpense(event, token, {
        amount: 18645,
        paidByUserId: user.id,
      });

      const { body } = await request()
        .get(`/api/v1/events/${event.id}/finances/summary`)
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(body.data).toMatchObject({
        expenses: 68645,
        refunds: 50000,
        total: 18645,
        owedToPeople: 18645,
        paidByPeople: 18645,
        paidByFunds: 50000,
        receiptCount: 3,
        receiptsWithoutFile: [1, 2, 3],
        receiptsPending: [],
      });
    });
  });

  it('suggests managers and names typed before', async () => {
    const { event, user, token } = await setup();
    await createExpense(event, token, { paidByName: 'Club' });

    const { body } = await request()
      .get(`/api/v1/events/${event.id}/finances/parties`)
      .auth(token, { type: 'bearer' })
      .expect(200);

    expect(body.data.managers).toEqual([
      { userId: user.id, name: user.name, role: 'DIRECTOR' },
    ]);
    expect(body.data.names).toEqual(['Club']);
    expect(body.data.selfUserId).toBe(user.id);
  });

  describe('export', () => {
    // Collects a binary response body instead of reading it as text.
    const binary = (
      res: NodeJS.ReadableStream,
      done: (err: Error | null, body: unknown) => void,
    ) => {
      const chunks: Uint8Array[] = [];
      res.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      res.on('end', () => done(null, Buffer.concat(chunks)));
    };

    it('writes the expenses as CSV in the reader’s language', async () => {
      const { event, token } = await setup('TREASURER');
      await createExpense(event, token, {
        amount: 4780,
        description: 'Pizza, drinks',
      });
      await createExpense(event, token, { type: 'REFUND', amount: 1240 });

      const { text, headers } = await request()
        .get(`/api/v1/events/${event.id}/finances/export?format=csv`)
        .set('Accept-Language', 'de-DE')
        .auth(token, { type: 'bearer' })
        .expect(200);

      expect(headers['content-type']).toContain('text/csv');
      expect(headers['content-disposition']).toContain('finanzen-');
      const lines = text.replace('﻿', '').trim().split('\r\n');
      expect(lines[0]).toContain('Beleg-Nr.');
      expect(lines).toHaveLength(3);
      expect(lines[1]).toContain('"Pizza, drinks"');
      expect(lines[2]).toContain('Erstattung');
      expect(lines[2]).toContain('-12.4');
    });

    it('builds a workbook with expenses, payouts and categories', async () => {
      const { event, token } = await setup();
      await createExpense(event, token);

      const { body, headers } = await request()
        .get(`/api/v1/events/${event.id}/finances/export`)
        .auth(token, { type: 'bearer' })
        .buffer(true)
        .parse(binary as Parameters<ReturnType<typeof request>['parse']>[0])
        .expect(200);

      expect(headers['content-type']).toContain('spreadsheetml');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(body as ArrayBuffer);
      expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
        'Expenses',
        'Payouts',
        'Categories',
      ]);
      expect(workbook.getWorksheet('Expenses')?.rowCount).toBe(2);
    });

    it('streams an empty archive when no receipt has a file', async () => {
      const { event, token } = await setup();
      await createExpense(event, token);

      const { headers } = await request()
        .get(`/api/v1/events/${event.id}/finances/receipts`)
        .auth(token, { type: 'bearer' })
        .buffer(true)
        .parse(binary as Parameters<ReturnType<typeof request>['parse']>[0])
        .expect(200);

      expect(headers['content-type']).toContain('application/zip');
    });

    it.each(['COUNSELOR', 'VIEWER'])(
      'refuses the export to a %s',
      async (role) => {
        const { event, token } = await setup(role);

        await request()
          .get(`/api/v1/events/${event.id}/finances/export`)
          .auth(token, { type: 'bearer' })
          .expect(403);
        await request()
          .get(`/api/v1/events/${event.id}/finances/receipts`)
          .auth(token, { type: 'bearer' })
          .expect(403);
      },
    );
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import {
  EventFactory,
  EventManagerFactory,
  TaskFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import { request } from '../utils/request.js';
import { generateAccessToken } from './utils/token.js';
import { resolve } from '#core/ioc/container';
import { NoOpMailer } from '#core/mail/drivers/noop.mailer';
import { TaskReminderService } from '#app/task/task-reminder.service';

const mailer = NoOpMailer.prototype;

// 09:00 in Europe/Berlin (CET, UTC+1), the events' default timezone.
const MORNING = new Date('2026-11-11T08:00:00Z');

const run = (now = MORNING) =>
  resolve(TaskReminderService).sendDueReminders(now);

async function assignedTask(
  dueDate: string | null,
  { completed = false, assigned = true, timezone = 'Europe/Berlin' } = {},
) {
  const event = await EventFactory.create({ timezone });
  const user = await UserFactory.create();
  const manager = await EventManagerFactory.create({
    event: { connect: { id: event.id } },
    user: { connect: { id: user.id } },
    role: 'DIRECTOR',
  });
  const task = await TaskFactory.create({
    event: { connect: { id: event.id } },
    dueDate,
    completed,
    ...(assigned ? { assignee: { connect: { id: manager.id } } } : {}),
  });

  return { event, user, task };
}

const reminderSentAt = async (id: string) =>
  prisma.task
    .findUniqueOrThrow({ where: { id }, select: { reminderSentAt: true } })
    .then((task) => task.reminderSentAt);

describe('task due reminders', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany();
  });

  it('should remind the assignee the day before the due date', async () => {
    const { user, task } = await assignedTask('2026-11-12');

    await run();

    expect(await reminderSentAt(task.id)).not.toBeNull();
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.objectContaining({ address: user.email }),
      }),
    );
  });

  it('should remind a task due today that was not reminded yet', async () => {
    const { task } = await assignedTask('2026-11-11');

    await run();

    expect(await reminderSentAt(task.id)).not.toBeNull();
  });

  it('should send only once', async () => {
    await assignedTask('2026-11-12');

    await run();
    await run();

    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
  });

  it('should wait for the morning in the event timezone', async () => {
    const { task } = await assignedTask('2026-11-12');

    // 06:00 in Berlin.
    await run(new Date('2026-11-11T05:00:00Z'));

    expect(await reminderSentAt(task.id)).toBeNull();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('should not send at night', async () => {
    const { task } = await assignedTask('2026-11-12');

    // 22:00 in Berlin.
    await run(new Date('2026-11-11T21:00:00Z'));

    expect(await reminderSentAt(task.id)).toBeNull();
  });

  it('should use the event timezone to decide the day', async () => {
    // 20:00 UTC on the 11th is 09:00 on the 12th in Auckland: the 13th is
    // tomorrow there, while the 11th is already overdue.
    const { task: dueTomorrow } = await assignedTask('2026-11-13', {
      timezone: 'Pacific/Auckland',
    });
    const { task: overdue } = await assignedTask('2026-11-11', {
      timezone: 'Pacific/Auckland',
    });

    await run(new Date('2026-11-11T20:00:00Z'));

    expect(await reminderSentAt(dueTomorrow.id)).not.toBeNull();
    expect(await reminderSentAt(overdue.id)).toBeNull();
  });

  it.each([
    { name: 'due later', dueDate: '2026-11-13', options: {} },
    { name: 'overdue', dueDate: '2026-11-10', options: {} },
    { name: 'without a due date', dueDate: null, options: {} },
    { name: 'completed', dueDate: '2026-11-12', options: { completed: true } },
    { name: 'unassigned', dueDate: '2026-11-12', options: { assigned: false } },
  ])('should skip tasks $name', async ({ dueDate, options }) => {
    const { task } = await assignedTask(dueDate, options);

    await run();

    expect(await reminderSentAt(task.id)).toBeNull();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('should reset the reminder when the due date changes', async () => {
    const { event, user, task } = await assignedTask('2026-11-12');
    await prisma.task.update({
      where: { id: task.id },
      data: { reminderSentAt: new Date() },
    });

    await request()
      .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
      .send({ dueDate: '2026-11-20' })
      .auth(generateAccessToken(user), { type: 'bearer' })
      .expect(200);

    expect(await reminderSentAt(task.id)).toBeNull();
  });

  it('should keep the reminder when other fields change', async () => {
    const { event, user, task } = await assignedTask('2026-11-12');
    await prisma.task.update({
      where: { id: task.id },
      data: { reminderSentAt: new Date() },
    });

    await request()
      .patch(`/api/v1/events/${event.id}/tasks/${task.id}`)
      .send({ title: 'Renamed', dueDate: '2026-11-12' })
      .auth(generateAccessToken(user), { type: 'bearer' })
      .expect(200);

    expect(await reminderSentAt(task.id)).not.toBeNull();
  });
});

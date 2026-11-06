import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  RegistrationFactory,
} from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import { up } from '../../../prisma/migrations/20261025190000_add_payments/migration.js';

const label = { en: 'Participation fee', de: 'Teilnahmebeitrag' };

const oldColumn = {
  name: 'participation_fee_paid',
  field: 'customData.participation_fee_paid',
  label,
  align: 'center',
  renderAs: 'editor',
  sortable: true,
  source: 'custom',
};

const nameColumn = { name: 'first_name', field: 'data.first_name' };

const paymentColumn = {
  name: 'payment',
  field: 'payment',
  source: 'meta',
  label,
  align: 'left',
  renderAs: 'payment',
  sortable: false,
};

describe('data migration: add_payments', () => {
  const run = () => prisma.$transaction((tx) => up(tx));

  const createTemplate = async (eventId: string, columns: object[]) =>
    prisma.tableTemplate.create({
      data: { eventId, data: { id: 'payments', title: 'Payments', columns } },
    });

  const columnsOf = async (id: string) => {
    const { data } = await prisma.tableTemplate.findUniqueOrThrow({
      where: { id },
    });
    return (data as { columns: unknown[] }).columns;
  };

  it('swaps the old fee column for the payment column', async () => {
    const event = await EventFactory.create();
    const template = await createTemplate(event.id, [nameColumn, oldColumn]);

    await run();

    expect(await columnsOf(template.id)).toEqual([nameColumn, paymentColumn]);
  });

  it('keeps old values in view as a read-only column', async () => {
    const event = await EventFactory.create();
    await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      customData: { participation_fee_paid: 'paid 12.05.' },
    });
    const template = await createTemplate(event.id, [oldColumn, nameColumn]);

    await run();

    expect(await columnsOf(template.id)).toEqual([
      paymentColumn,
      {
        ...oldColumn,
        label: {
          en: 'Participation fee (old)',
          de: 'Teilnahmebeitrag (alt)',
        },
        renderAs: 'default',
      },
      nameColumn,
    ]);
  });

  it('leaves tables without the old column alone', async () => {
    const event = await EventFactory.create();
    const template = await createTemplate(event.id, [nameColumn]);

    await run();

    expect(await columnsOf(template.id)).toEqual([nameColumn]);
  });
});

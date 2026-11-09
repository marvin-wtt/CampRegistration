import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '#generated/prisma/client.js';
import { up } from '../../../prisma/migrations/20261108110000_price_based_complete_text/migration.js';

async function migrate(form: Record<string, unknown>) {
  const update = vi.fn();
  const tx = {
    event: {
      findMany: vi.fn().mockResolvedValue([{ id: 'e1', form }]),
      update,
    },
  } as unknown as Prisma.TransactionClient;

  await up(tx);

  return update.mock.calls[0]?.[0] as
    { data: { form: Record<string, unknown> } } | undefined;
}

describe('price_based_complete_text', () => {
  it.each([
    [
      'all locales',
      {
        en: 'Register for a fee',
        de: 'Kostenpflichtig Anmelden',
        fr: 'Inscription payante',
        pl: 'Zarejestruj się (płatne)',
        cs: 'Zaregistrovat se (placeně)',
        default: 'Register for a fee',
      },
    ],
    [
      "the event's locales",
      { default: 'Register for a fee', de: 'Kostenpflichtig Anmelden' },
    ],
    ['a single locale as a string', 'Anmeldung abschließen'],
  ])('removes a preset text stored with %s', async (_, completeText) => {
    const call = await migrate({ title: 'Camp', completeText });

    expect(call?.data.form).toEqual({ title: 'Camp' });
  });

  it.each([
    ['an edited text', { default: 'Jetzt anmelden', de: 'Jetzt anmelden' }],
    [
      'a preset text with one locale edited',
      { default: 'Register for a fee', de: 'Jetzt anmelden' },
    ],
    ['a custom string', 'Jetzt anmelden'],
  ])('keeps %s', async (_, completeText) => {
    await expect(migrate({ completeText })).resolves.toBeUndefined();
  });

  it('leaves a form without a text alone', async () => {
    await expect(migrate({ title: 'Camp' })).resolves.toBeUndefined();
  });
});

import moment from 'moment';
import type { PrismaClient } from '#generated/prisma/client.js';
import { defaultExpenseCategoriesForCountries } from '#app/expenseCategory/expense-category.defaults.js';
import { BaseSeeder } from './BaseSeeder';
import { EVENT_IDS, USER_IDS } from './ids';
import { seedReceiptFile } from './file.seeder';

type Payer = keyof typeof USER_IDS | { name: string } | null;

interface SeedExpense {
  /** Days after the event start; negative for before it. `null` while the
   * receipt is still to come. */
  day: number | null;
  description: string;
  category: string;
  /** Major units. */
  amount: number;
  payer: Payer;
  refund?: boolean;
  file?: boolean;
  original?: { amount: number; currency: string };
}

interface SeedPayout {
  /** Days after the event start it was paid; `null` while still to pay. */
  day: number | null;
  /** Major units, positive. */
  amount: number;
  direction: 'OUT' | 'IN';
  recipient: Exclude<Payer, null>;
  note?: string;
  /** Signed by the recipient on screen. */
  signed?: boolean;
}

// A plain stroke, enough to show a signed statement.
const SEED_SIGNATURE =
  'M40 140 Q80 60 120 130 T200 120 L260 90 Q300 70 330 120';

interface SeedLedger {
  /** Category names, grouped when a group name is given. */
  categories: { group?: string; names: string[] }[];
  expenses: SeedExpense[];
  payouts: SeedPayout[];
  /** Receipt numbers to delete afterwards, leaving a visible gap. */
  deleted?: number[];
}

/**
 * Spring Event is settled after the fact: a funder's eligible/non-eligible
 * grouping, refunds, a foreign receipt, advances and partial payouts, so
 * every balance state shows — owed, settled, owing the event.
 */
const SPRING: SeedLedger = {
  categories: [
    {
      group: 'Eligible (funder)',
      names: ['Travel', 'Accommodation', 'Food', 'Program'],
    },
    { group: 'Not eligible', names: ['Materials', 'Other'] },
  ],
  expenses: [
    {
      day: 0,
      description: 'Train tickets, outward',
      category: 'Travel',
      amount: 412,
      payer: 'john',
      file: true,
    },
    {
      day: 0,
      description: 'House deposit',
      category: 'Accommodation',
      amount: 500,
      payer: null,
      file: true,
    },
    {
      day: 1,
      description: 'Groceries, Tesco',
      category: 'Food',
      amount: 186.45,
      payer: 'erika',
      file: true,
    },
    {
      day: 1,
      description: 'Craft supplies',
      category: 'Materials',
      amount: 64.9,
      payer: 'peter',
    },
    {
      day: 2,
      description: 'Climbing hall entry',
      category: 'Program',
      amount: 240,
      payer: null,
      file: true,
    },
    {
      day: 2,
      description: 'Bakery',
      category: 'Food',
      amount: 38.2,
      payer: 'erika',
      file: true,
    },
    {
      day: 3,
      description: 'Groceries, Sainsbury’s',
      category: 'Food',
      amount: 152.1,
      payer: 'john',
      file: true,
    },
    {
      day: 3,
      description: 'Ferry to the island',
      category: 'Travel',
      amount: 96,
      payer: { name: 'Tom (driver)' },
      original: { amount: 82, currency: 'GBP' },
    },
    {
      day: 4,
      description: 'First aid refill',
      category: 'Other',
      amount: 23.75,
      payer: 'peter',
      file: true,
    },
    {
      day: 4,
      description: 'Bottle deposit returned',
      category: 'Food',
      amount: 12.4,
      payer: 'erika',
      refund: true,
    },
    {
      day: 5,
      description: 'Groceries, Tesco',
      category: 'Food',
      amount: 171.35,
      payer: 'john',
      file: true,
    },
    // #12 — deleted below, so the list shows a gap.
    {
      day: 5,
      description: 'Duplicate entry',
      category: 'Food',
      amount: 171.35,
      payer: 'john',
    },
    {
      day: 5,
      description: 'Museum tickets',
      category: 'Program',
      amount: 88,
      payer: { name: 'Tom (driver)' },
      file: true,
    },
    {
      day: 6,
      description: 'Firewood',
      category: 'Materials',
      amount: 35,
      payer: null,
      file: true,
    },
    {
      day: 6,
      description: 'Pizza night',
      category: 'Food',
      amount: 124.5,
      payer: 'erika',
      file: true,
    },
    {
      day: 7,
      description: 'House deposit returned',
      category: 'Accommodation',
      amount: 500,
      payer: null,
      refund: true,
      file: true,
    },
    {
      day: 7,
      description: 'Train tickets, return',
      category: 'Travel',
      amount: 398,
      payer: 'john',
    },
    {
      // The invoice is still to come: no date, no file yet.
      day: null,
      description: 'Climbing instructor, invoice',
      category: 'Program',
      amount: 180,
      payer: null,
    },
  ],
  payouts: [
    {
      day: 0,
      amount: 200,
      direction: 'OUT',
      recipient: 'erika',
      note: 'Advance for groceries',
    },
    {
      day: 0,
      amount: 250,
      direction: 'OUT',
      recipient: { name: 'Tom (driver)' },
      note: 'Advance, cash',
    },
    {
      day: 4,
      amount: 600,
      direction: 'OUT',
      recipient: 'john',
      note: 'Cash from the box',
    },
    {
      day: 8,
      amount: 136.75,
      direction: 'OUT',
      recipient: 'erika',
      note: 'Bank transfer',
      signed: true,
    },
    {
      // Agreed and signed, the transfer still to be made.
      day: null,
      amount: 88.65,
      direction: 'OUT',
      recipient: 'peter',
      note: 'Bank transfer',
      signed: true,
    },
  ],
  deleted: [12],
};

/** Running now, John a COUNSELOR: he sees his own receipts and balance only. */
const CITY: SeedLedger = {
  categories: [],
  expenses: [
    {
      day: 0,
      description: 'Einkauf Supermarkt',
      category: 'Verpflegung',
      amount: 86.4,
      payer: 'john',
      file: true,
    },
    {
      day: 0,
      description: 'MVV-Gruppentickets',
      category: 'Fahrtkosten',
      amount: 120,
      payer: null,
      file: true,
    },
    {
      day: 1,
      description: 'Bäckerei',
      category: 'Verpflegung',
      amount: 23.1,
      payer: 'john',
    },
    {
      day: 1,
      description: 'Bastelmaterial',
      category: 'Material',
      amount: 41.8,
      payer: 'peter',
      file: true,
    },
    {
      day: 2,
      description: 'Eintritt Deutsches Museum',
      category: 'Programm',
      amount: 168,
      payer: 'peter',
    },
  ],
  payouts: [],
};

/** Upcoming: only what is paid ahead of a camp. */
const SUMMER: SeedLedger = {
  categories: [],
  expenses: [
    {
      day: -40,
      description: 'House deposit',
      category: 'Accommodation',
      amount: 800,
      payer: null,
      file: true,
    },
    {
      day: -21,
      description: 'Coach booking deposit',
      category: 'Travel',
      amount: 250,
      payer: 'john',
      file: true,
    },
    {
      day: null,
      description: 'Insurance premium, invoice expected',
      category: 'Other',
      amount: 95,
      payer: null,
    },
  ],
  payouts: [
    {
      day: -14,
      amount: 150,
      direction: 'OUT',
      recipient: 'erika',
      note: 'Advance for the first shop',
    },
  ],
};

const minor = (amount: number) => Math.round(amount * 100);

class FinanceSeeder extends BaseSeeder {
  name(): string {
    return 'finance';
  }

  async run(prisma: PrismaClient): Promise<void> {
    // Every event has categories, as on a real database after the migration.
    const events = await prisma.event.findMany({
      select: { id: true, countries: true },
    });
    for (const event of events) {
      if (event.id === EVENT_IDS.spring) {
        continue;
      }
      await prisma.expenseCategory.createMany({
        data: defaultExpenseCategoriesForCountries(
          event.countries as string[],
        ).map((category) => ({ eventId: event.id, ...category })),
      });
    }

    await this.seedLedger(prisma, EVENT_IDS.spring, SPRING);
    await this.seedLedger(prisma, EVENT_IDS.city, CITY);
    await this.seedLedger(prisma, EVENT_IDS.summer, SUMMER);
  }

  private async seedLedger(
    prisma: PrismaClient,
    eventId: string,
    ledger: SeedLedger,
  ): Promise<void> {
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: { eventManager: { include: { user: true } } },
    });

    // Custom categories replace nothing: only Spring defines its own.
    let position = 0;
    for (const set of ledger.categories) {
      const group = set.group
        ? await prisma.expenseCategory.create({
            data: { eventId, name: set.group, position: position++ },
          })
        : null;
      await prisma.expenseCategory.createMany({
        data: set.names.map((name, index) => ({
          eventId,
          parentId: group?.id ?? null,
          name,
          position: group ? index : position++,
        })),
      });
    }

    const categories = await prisma.expenseCategory.findMany({
      where: { eventId },
    });
    const categoryId = (name: string) => {
      const match = categories.find((c) =>
        typeof c.name === 'string'
          ? c.name === name
          : Object.values(c.name as Record<string, string>).includes(name),
      );
      if (!match) {
        throw new Error(`No category "${name}" on event ${eventId}`);
      }
      return match.id;
    };

    const party = (payer: Payer) => {
      if (payer === null) {
        return { userId: null, name: null };
      }
      if (typeof payer === 'object') {
        return { userId: null, name: payer.name };
      }
      const userId = USER_IDS[payer];
      const user = event.eventManager.find((m) => m.userId === userId)?.user;
      if (!user) {
        throw new Error(`${payer} does not manage event ${eventId}`);
      }
      return { userId, name: user.name };
    };

    const date = (day: number) =>
      moment(event.startAt).add(day, 'days').format('YYYY-MM-DD');

    let receiptNumber = 0;
    for (const item of ledger.expenses) {
      receiptNumber++;
      const payer = party(item.payer);
      const expense = await prisma.expense.create({
        data: {
          eventId,
          receiptNumber,
          type: item.refund ? 'REFUND' : 'EXPENSE',
          amount: minor(item.amount),
          originalAmount: item.original ? minor(item.original.amount) : null,
          originalCurrency: item.original?.currency ?? null,
          date: item.day === null ? null : date(item.day),
          description: item.description,
          categoryId: categoryId(item.category),
          paidByUserId: payer.userId,
          paidByName: payer.name,
          createdByUserId: payer.userId ?? USER_IDS.john,
        },
      });
      if (item.file) {
        await seedReceiptFile(
          eventId,
          expense.id,
          receiptNumber,
          item.description,
        );
      }
    }

    let payoutNumber = 0;
    for (const item of ledger.payouts) {
      payoutNumber++;
      const recipient = party(item.recipient);
      await prisma.payout.create({
        data: {
          eventId,
          number: payoutNumber,
          recipientUserId: recipient.userId,
          recipientName: recipient.name ?? '',
          direction: item.direction,
          amount: minor(item.amount),
          paidOn: item.day === null ? null : date(item.day),
          note: item.note ?? null,
          signature: item.signed ? SEED_SIGNATURE : null,
          signedAt: item.signed ? event.endAt : null,
          createdByUserId: USER_IDS.john,
        },
      });
    }

    if (ledger.deleted?.length) {
      await prisma.expense.deleteMany({
        where: { eventId, receiptNumber: { in: ledger.deleted } },
      });
    }

    // The counters remember every number handed out, deleted ones included.
    await prisma.event.update({
      where: { id: eventId },
      data: {
        lastReceiptNumber: receiptNumber,
        lastPayoutNumber: payoutNumber,
      },
    });
  }
}

export default new FinanceSeeder();

import prisma from '../client';
import { BaseSeeder } from './BaseSeeder';
import { PRICE_MODEL_IDS } from './ids';
import { seedDate } from './timeline';
import {
  FREE_PRICE_MODEL_ID,
  FREE_PRICE_MODEL_NAME,
} from '#app/billing/billing.utils';

/**
 * Runs before the organizations: every organization needs a price model, and
 * the free one must already be the default, as the migration leaves it.
 */
class PriceModelSeeder extends BaseSeeder {
  name(): string {
    return 'price-model';
  }

  async run(): Promise<void> {
    await prisma.priceModel.create({
      data: {
        id: FREE_PRICE_MODEL_ID,
        name: FREE_PRICE_MODEL_NAME,
        isDefault: true,
      },
    });

    await prisma.priceModel.createMany({
      data: [
        {
          id: PRICE_MODEL_IDS.standard,
          name: {
            en: 'Standard',
            de: 'Standard',
            fr: 'Standard',
            pl: 'Standardowy',
            cs: 'Standardní',
          },
          currency: 'EUR',
          pricePerRegistration: 1.5,
          baseFee: 25,
          taxRate: 19,
        },
        {
          id: PRICE_MODEL_IDS.nonProfit,
          name: {
            en: 'Non-profit',
            de: 'Gemeinnützig',
            fr: 'Association à but non lucratif',
            pl: 'Organizacja non-profit',
            cs: 'Neziskový',
          },
          currency: 'EUR',
          pricePerRegistration: 0.5,
        },
        {
          id: PRICE_MODEL_IDS.legacy,
          name: { en: 'Legacy 2024', de: 'Alt 2024' },
          currency: 'EUR',
          pricePerRegistration: 2,
          baseFee: 10,
          taxRate: 19,
          archivedAt: seedDate(-300),
        },
        {
          id: PRICE_MODEL_IDS.czech,
          name: { en: 'Standard (CZK)', cs: 'Standardní (CZK)' },
          currency: 'CZK',
          pricePerRegistration: 35,
          baseFee: 500,
          taxRate: 21,
        },
      ],
    });
  }
}

export default new PriceModelSeeder();

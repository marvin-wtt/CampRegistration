import { describe, expect, it } from 'vitest';
import { Prisma } from '#generated/prisma/client';
import { costsNoMore } from '#app/priceModel/price-model.utils';

const pricing = (
  price: string,
  baseFee = '0',
  taxRate = '19',
  currency = 'EUR',
) => ({
  currency,
  pricePerRegistration: new Prisma.Decimal(price),
  baseFee: new Prisma.Decimal(baseFee),
  taxRate: new Prisma.Decimal(taxRate),
});

describe('costsNoMore', () => {
  it('allows a model that is cheaper or the same', () => {
    expect(costsNoMore(pricing('3'), pricing('2'))).toBe(true);
    expect(costsNoMore(pricing('3', '10'), pricing('3', '10'))).toBe(true);
  });

  it('needs consent once any part costs more', () => {
    expect(costsNoMore(pricing('3'), pricing('4'))).toBe(false);
    expect(costsNoMore(pricing('3', '0'), pricing('2', '5'))).toBe(false);
    expect(costsNoMore(pricing('3', '0', '7'), pricing('3', '0', '19'))).toBe(
      false,
    );
  });

  it('needs consent for another currency, which cannot be compared', () => {
    expect(costsNoMore(pricing('3'), pricing('1', '0', '19', 'CZK'))).toBe(
      false,
    );
  });
});

import type { Request } from 'express';
import type { GuardFn } from '#core/guard';
import { resolve } from '#core/ioc/container';
import { PriceModelOfferService } from './price-model-offer.service.js';

/**
 * Refuses once the bound organization has a due price change it hasn't
 * accepted. It throws its own 409 so the client can explain why; compose it
 * after the membership check, so outsiders learn nothing about the prices.
 */
export const priceModelAccepted: GuardFn = async (req: Request) => {
  await resolve(PriceModelOfferService).assertMayCreateEvents(
    req.modelOrFail('organization').id,
  );

  return true;
};

import { afterEach, describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Event, Registration } from '#generated/prisma/client.js';
import {
  clearTemplateContexts,
  registerTemplateContext,
  resolveTemplateContexts,
} from '#app/registration/messages/template-context';
import { registerPaymentTemplateContexts } from '#app/payment/payment.template-context';
import type { PaymentService } from '#app/payment/payment.service';

const source = {
  event: { id: 'event-1', currency: 'EUR' } as Event,
  registration: { id: 'registration-1', amountDue: 15000 } as Registration,
  locale: 'en-US',
  extra: {},
};

afterEach(() => {
  clearTemplateContexts();
});

describe('template contexts', () => {
  it('resolves every registered context under its name', async () => {
    registerTemplateContext('one', () => ({ value: 1 }));
    registerTemplateContext('two', () => Promise.resolve(null));

    await expect(resolveTemplateContexts(source)).resolves.toEqual({
      one: { value: 1 },
      two: null,
    });
  });

  it('refuses a name registered twice', () => {
    registerTemplateContext('one', () => null);

    expect(() => registerTemplateContext('one', () => null)).toThrow(
      /Duplicate/,
    );
  });
});

describe('payment template contexts', () => {
  const paymentService = mock<PaymentService>();

  it('names what is still outstanding beside the amount due', async () => {
    paymentService.getBalance.mockResolvedValue({
      outstanding: 10000,
    } as never);
    registerPaymentTemplateContexts(paymentService);

    const { payment } = await resolveTemplateContexts(source);

    expect(payment).toMatchObject({
      amount: '€150.00',
      outstanding: '€100.00',
      url: expect.stringContaining('token=') as unknown,
    });
  });

  it('hides the payment tokens when nothing is owed', async () => {
    registerPaymentTemplateContexts(paymentService);

    const { payment } = await resolveTemplateContexts({
      ...source,
      registration: { ...source.registration, amountDue: 0 },
    });

    expect(payment).toBeNull();
    expect(paymentService.getBalance).not.toHaveBeenCalled();
  });

  it('fills the refund tokens from what the mail passed along', async () => {
    registerPaymentTemplateContexts(paymentService);

    const { refund } = await resolveTemplateContexts({
      ...source,
      extra: { refund: { amount: 5000, reason: 'Canceled' } },
    });

    expect(refund).toEqual({ amount: '€50.00', reason: 'Canceled' });
  });
});

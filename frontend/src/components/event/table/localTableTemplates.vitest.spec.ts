import { describe, expect, it } from 'vitest';
import type {
  Registration,
  RegistrationPaymentStatus,
} from '@camp-registration/common/entities';
import {
  owesFee,
  paymentOpen,
} from '@/components/event/table/localTableTemplates';

function registration(
  status: Registration['status'],
  paymentStatus: RegistrationPaymentStatus,
): Registration {
  return {
    status,
    payment: {
      status: paymentStatus,
      currency: 'EUR',
      amountDue: paymentStatus === 'NOT_REQUIRED' ? null : 12000,
      amountPaid: 0,
      quotedAmount: null,
      adjustment: null,
      outstanding: 0,
      requestedAt: null,
      remindedAt: null,
    },
  } as Registration;
}

describe('payment templates', () => {
  it('lists accepted registrations that are not paid in full', () => {
    expect(paymentOpen(registration('ACCEPTED', 'UNPAID'))).toBe(true);
    expect(paymentOpen(registration('ACCEPTED', 'PARTIAL'))).toBe(true);
    expect(paymentOpen(registration('ACCEPTED', 'PAID'))).toBe(false);
    expect(paymentOpen(registration('ACCEPTED', 'NOT_REQUIRED'))).toBe(false);
  });

  it('leaves out registrations that may still be turned down', () => {
    expect(paymentOpen(registration('PENDING', 'UNPAID'))).toBe(false);
    expect(paymentOpen(registration('WAITLISTED', 'UNPAID'))).toBe(false);
  });

  it('lists accepted registrations with a fee among all payments', () => {
    expect(owesFee(registration('ACCEPTED', 'REFUNDED'))).toBe(true);
    expect(owesFee(registration('ACCEPTED', 'NOT_REQUIRED'))).toBe(false);
    expect(owesFee(registration('PENDING', 'UNPAID'))).toBe(false);
    expect(owesFee(registration('WAITLISTED', 'UNPAID'))).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  paymentRequestDate,
  paymentRequestsOpen,
} from '../../../src/utils/paymentRequest.js';

const timing = {
  timing: 'ACCEPTANCE' as const,
  requestDate: null,
  requestDaysBeforeStart: null,
};
const event = { startAt: '2027-07-10T14:00:00', timezone: 'Europe/Berlin' };

describe('paymentRequestDate', () => {
  it('has none when requests go out on acceptance', () => {
    expect(paymentRequestDate(timing, event.startAt)).toBeNull();
  });

  it('uses the fixed date', () => {
    expect(
      paymentRequestDate(
        { ...timing, timing: 'DATE', requestDate: '2027-05-01' },
        event.startAt,
      ),
    ).toBe('2027-05-01');
  });

  it('counts days back from the start, across months', () => {
    expect(
      paymentRequestDate(
        { ...timing, timing: 'BEFORE_START', requestDaysBeforeStart: 30 },
        event.startAt,
      ),
    ).toBe('2027-06-10');
  });
});

describe('paymentRequestsOpen', () => {
  const byDate = {
    ...timing,
    timing: 'DATE' as const,
    requestDate: '2027-05-01',
  };

  it('opens on the day itself in the event time zone', () => {
    // 22:30 UTC on 30 April is already 1 May in Berlin.
    expect(
      paymentRequestsOpen(byDate, event, new Date('2027-04-30T22:30:00Z')),
    ).toBe(true);
    expect(
      paymentRequestsOpen(byDate, event, new Date('2027-04-30T21:30:00Z')),
    ).toBe(false);
  });

  it('is always open on acceptance timing', () => {
    expect(paymentRequestsOpen(timing, event)).toBe(true);
  });
});

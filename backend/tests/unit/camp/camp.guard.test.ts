import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import type { Camp } from '#generated/prisma/client';
import { registrationOpen } from '#app/camp/camp.guard';

const fakeReq = (camp: Partial<Camp>, userId = 'user-1'): Request =>
  ({
    authUserId: () => userId,
    modelOrFail: () => camp,
  }) as unknown as Request;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('registrationOpen', () => {
  const at = (iso: string) => new Date(iso);

  it('returns false when neither an opens nor a closes date is set', () => {
    const camp = { registrationOpensAt: null, registrationClosesAt: null };

    expect(registrationOpen(fakeReq(camp))).toBe(false);
  });

  it('returns false before the opening date', () => {
    const camp = {
      registrationOpensAt: at('2999-01-01'),
      registrationClosesAt: null,
    };

    expect(registrationOpen(fakeReq(camp))).toBe(false);
  });

  it('returns false after the closing date', () => {
    const camp = {
      registrationOpensAt: null,
      registrationClosesAt: at('2000-01-01'),
    };

    expect(registrationOpen(fakeReq(camp))).toBe(false);
  });

  it('returns false at the closing date', () => {
    const closesAt = at('2026-01-01T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(closesAt);

    const camp = {
      registrationOpensAt: null,
      registrationClosesAt: closesAt,
    };

    expect(registrationOpen(fakeReq(camp))).toBe(false);
  });

  it('returns true within the registration window', () => {
    const camp = {
      registrationOpensAt: at('2000-01-01'),
      registrationClosesAt: at('2999-01-01'),
    };

    expect(registrationOpen(fakeReq(camp))).toBe(true);
  });

  it('returns true when only a past opens date is set', () => {
    const camp = {
      registrationOpensAt: at('2000-01-01'),
      registrationClosesAt: null,
    };

    expect(registrationOpen(fakeReq(camp))).toBe(true);
  });

  it('returns true when only a future closes date is set', () => {
    const camp = {
      registrationOpensAt: null,
      registrationClosesAt: at('2999-01-01'),
    };

    expect(registrationOpen(fakeReq(camp))).toBe(true);
  });
});

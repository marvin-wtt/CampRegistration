import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { admin, ADMIN_TWO_FACTOR_REQUIRED, guard } from '#core/guard';
import ApiError from '#core/router/ApiError';

const fakeReq = (user?: object): Request =>
  ({
    user,
    isUnauthenticated: () => user === undefined,
  }) as unknown as Request;

const withTwoFactor = { confirmedAt: new Date() };

async function runGuard(
  req: Request,
  guardFn?: () => boolean,
): Promise<unknown> {
  const next = vi.fn<(err?: unknown) => void>();
  guard(guardFn)(req, {} as Response, next as NextFunction);
  await vi.waitFor(() => {
    expect(next).toHaveBeenCalled();
  });

  return next.mock.calls[0]?.[0];
}

describe('admin', () => {
  it('passes an administrator with confirmed 2FA', () => {
    expect(admin(fakeReq({ role: 'ADMIN', twoFactor: withTwoFactor }))).toBe(
      true,
    );
  });

  it.each([
    ['no 2FA', { role: 'ADMIN', twoFactor: null }],
    ['pending 2FA setup', { role: 'ADMIN', twoFactor: { confirmedAt: null } }],
    ['a regular user', { role: 'USER', twoFactor: withTwoFactor }],
  ])('refuses %s', (_, user) => {
    expect(admin(fakeReq(user))).toBe(false);
  });
});

describe('guard', () => {
  it('lets an administrator with 2FA through an admin-only route', async () => {
    const result = await runGuard(
      fakeReq({ role: 'ADMIN', twoFactor: withTwoFactor }),
    );

    expect(result).toBeUndefined();
  });

  it('asks an administrator without 2FA to set it up', async () => {
    const result = await runGuard(fakeReq({ role: 'ADMIN', twoFactor: null }));

    expect(result).toBeInstanceOf(ApiError);
    expect(result).toMatchObject({
      statusCode: 403,
      code: ADMIN_TWO_FACTOR_REQUIRED,
    });
  });

  it('still passes an administrator without 2FA on their own permissions', async () => {
    const result = await runGuard(
      fakeReq({ role: 'ADMIN', twoFactor: null }),
      () => true,
    );

    expect(result).toBeUndefined();
  });

  it('refuses a regular user with a plain 403', async () => {
    const result = await runGuard(fakeReq({ role: 'USER', twoFactor: null }));

    expect(result).toMatchObject({ statusCode: 403, code: undefined });
  });
});

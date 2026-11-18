import { beforeEach, describe, expect, it } from 'vitest';
import type { Request } from 'express';
import {
  assertScopeResolversComplete,
  clearScopeResolvers,
  registerScopeResolver,
  scoped,
  scopedView,
  type ScopeResolver,
} from '#core/permission/permission.guard';
import { clearOwnership, registerOwnership } from '#core/permission/ownership';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';

const stub = <S extends 'event' | 'newsletter' | 'organization'>(
  model: ScopeResolver<S>['model'],
): ScopeResolver<S> => ({
  model,
  resolve: () => Promise.resolve(null),
});

beforeEach(() => {
  clearScopeResolvers();
});

describe('registerScopeResolver', () => {
  it('rejects a second resolver for the same scope', () => {
    registerScopeResolver('event', stub('event'));

    expect(() => registerScopeResolver('event', stub('event'))).toThrow(
      /Duplicate permission resolver for scope 'event'/,
    );
  });
});

describe('assertScopeResolversComplete', () => {
  it('names the scopes left unwired', () => {
    registerScopeResolver('event', stub('event'));

    expect(() => assertScopeResolversComplete()).toThrow(
      /newsletter, organization/,
    );
  });

  it('passes once every scope is registered', () => {
    registerScopeResolver('event', stub('event'));
    registerScopeResolver('newsletter', stub('newsletter'));
    registerScopeResolver('organization', stub('organization'));

    expect(() => assertScopeResolversComplete()).not.toThrow();
  });

  // Guards against a scope being added to `PermissionScopes` without the test
  // above being extended to cover it.
  it('covers every declared scope', () => {
    expect(PERMISSION_SCOPES).toStrictEqual([
      'event',
      'newsletter',
      'organization',
    ]);
  });
});

describe('own grants', () => {
  const resolveTo = (grants: string[]): ScopeResolver<'event'> => ({
    model: 'event',
    resolve: () => Promise.resolve(new Set(grants) as never),
  });

  const fakeReq = (
    record?: object,
    query: Record<string, string> = {},
  ): Request => {
    const models: Record<string, unknown> = { event: { id: 'event-1' } };
    if (record) {
      models.eventManager = record;
    }

    return {
      query,
      authUserId: () => 'user-1',
      model: (key: string) => models[key],
      modelOrFail: (key: string) => models[key],
    } as unknown as Request;
  };

  beforeEach(() => {
    clearOwnership();
    registerOwnership('eventManager', ['userId']);
  });

  it('passes a full grant on any record', async () => {
    registerScopeResolver('event', resolveTo(['event.managers.edit']));
    const guard = scoped('event', 'event.managers.edit', {
      own: 'eventManager',
    });

    await expect(guard(fakeReq({ userId: 'other' }))).resolves.toBe(true);
  });

  it('passes an own grant only on an owned record of the named model', async () => {
    registerScopeResolver('event', resolveTo(['event.managers.edit:own']));
    const guard = scoped('event', 'event.managers.edit', {
      own: 'eventManager',
    });

    await expect(guard(fakeReq({ userId: 'user-1' }))).resolves.toBe(true);
    await expect(guard(fakeReq({ userId: 'other' }))).resolves.toBe(false);
  });

  it('ignores an own grant on a route that names no model', async () => {
    registerScopeResolver('event', resolveTo(['event.managers.edit:own']));
    const guard = scoped('event', 'event.managers.edit');

    await expect(guard(fakeReq({ userId: 'user-1' }))).resolves.toBe(false);
  });

  it('throws on a misconfigured own model', async () => {
    registerScopeResolver('event', resolveTo(['event.managers.edit:own']));

    // Not bound on the request.
    await expect(
      scoped('event', 'event.managers.edit', { own: 'eventManager' })(
        fakeReq(),
      ),
    ).rejects.toThrow(/not bound/);
    // Bound, but declares no owners.
    await expect(
      scoped('event', 'event.managers.edit', { own: 'registration' })({
        ...fakeReq(),
        model: () => ({ id: 'registration-1' }),
      } as unknown as Request),
    ).rejects.toThrow(/declares no owners/);
  });

  it('opens view=own to an own grant and view=all only to the full grant', async () => {
    registerScopeResolver('event', resolveTo(['event.managers.view:own']));
    const guard = scopedView('event', 'event.managers.view');

    await expect(guard(fakeReq(undefined, { view: 'own' }))).resolves.toBe(
      true,
    );
    // Omitted means `own`.
    await expect(guard(fakeReq())).resolves.toBe(true);
    await expect(guard(fakeReq(undefined, { view: 'all' }))).resolves.toBe(
      false,
    );
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import {
  assertScopeResolversComplete,
  clearScopeResolvers,
  registerScopeResolver,
  type ScopeResolver,
} from '#core/permission.guard';
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

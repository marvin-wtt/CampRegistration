import { beforeEach, describe, expect, it } from 'vitest';
import {
  assertScopeResolversComplete,
  clearScopeResolvers,
  registerScopeResolver,
  type ScopeResolver,
} from '#core/permission.guard';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';

const stub = <S extends 'camp' | 'newsletter' | 'organization'>(
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
    registerScopeResolver('camp', stub('camp'));

    expect(() => registerScopeResolver('camp', stub('camp'))).toThrow(
      /Duplicate permission resolver for scope 'camp'/,
    );
  });
});

describe('assertScopeResolversComplete', () => {
  it('names the scopes left unwired', () => {
    registerScopeResolver('camp', stub('camp'));

    expect(() => assertScopeResolversComplete()).toThrow(
      /newsletter, organization/,
    );
  });

  it('passes once every scope is registered', () => {
    registerScopeResolver('camp', stub('camp'));
    registerScopeResolver('newsletter', stub('newsletter'));
    registerScopeResolver('organization', stub('organization'));

    expect(() => assertScopeResolversComplete()).not.toThrow();
  });

  // Guards against a scope being added to `PermissionScopes` without the test
  // above being extended to cover it.
  it('covers every declared scope', () => {
    expect(PERMISSION_SCOPES).toStrictEqual([
      'camp',
      'newsletter',
      'organization',
    ]);
  });
});

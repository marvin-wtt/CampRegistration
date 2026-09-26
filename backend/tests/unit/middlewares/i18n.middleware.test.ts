import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { requestLocale } from '#middlewares/i18n.middleware';

/** Mirrors what `accepts` hands back for the header in question. */
const req = (accepted: (string | undefined)[]): Request =>
  ({ acceptsLanguages: () => accepted }) as unknown as Request;

describe('requestLocale', () => {
  it('returns the preferred tag', () => {
    expect(requestLocale(req(['de-DE', 'de']))).toBe('de-DE');
  });

  it('canonicalises casing so translations match', () => {
    expect(requestLocale(req(['de-de']))).toBe('de-DE');
  });

  it('defaults when the client accepts anything', () => {
    expect(requestLocale(req(['*']))).toBe('en-US');
  });

  // An empty `Accept-Language` header yields no language at all.
  it('defaults when there is no language to speak of', () => {
    expect(requestLocale(req([]))).toBe('en-US');
  });

  it('defaults for a malformed tag rather than throwing', () => {
    expect(requestLocale(req(['en_US~broken']))).toBe('en-US');
    expect(requestLocale(req(['x'.repeat(40)]))).toBe('en-US');
  });
});

import { describe, expect, it } from 'vitest';
import { isValidWebsiteUrl, normalizeWebsiteUrl } from './websiteUrl';

describe('normalizeWebsiteUrl', () => {
  it.each([
    ['example.com', 'https://example.com'],
    ['  www.example.com/path ', 'https://www.example.com/path'],
    ['http://example.com', 'http://example.com'],
    ['HTTPS://example.com', 'HTTPS://example.com'],
    ['javascript:alert(1)', 'javascript:alert(1)'],
    ['', ''],
    ['   ', ''],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeWebsiteUrl(input)).toBe(expected);
  });
});

describe('isValidWebsiteUrl', () => {
  it.each([
    'https://example.com',
    'http://sub.example.co.uk/path?x=1',
    'https://münchen.de',
  ])('accepts %j', (value) => {
    expect(isValidWebsiteUrl(value)).toBe(true);
  });

  it.each([
    'example.com',
    'https://example',
    'http://localhost',
    'https:/x',
    'https://exa mple.com',
    'javascript:alert(1)',
    'mailto:info@example.com',
    'ftp://example.com',
    `https://example.com/${'a'.repeat(255)}`,
  ])('rejects %j', (value) => {
    expect(isValidWebsiteUrl(value)).toBe(false);
  });
});

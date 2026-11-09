import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CaptchaUnavailableError } from '#core/captcha/captcha.provider';
import { TurnstileProvider } from '#core/captcha/turnstile.provider';
import logger from '#core/logger';

vi.mock('#core/logger', () => ({
  default: { warn: vi.fn(), error: vi.fn() },
}));

const options = {
  siteKey: 'site-key',
  secret: 'secret',
  hostnames: ['example.com'],
};
const provider = new TurnstileProvider(options);

const fetchMock = vi.fn();

function respond(body: object, status = 200) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  );
}

describe('TurnstileProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    vi.mocked(logger.warn).mockClear();
  });

  it('accepts a successful token for the expected action and hostname', async () => {
    respond({ success: true, action: 'signup', hostname: 'example.com' });

    await expect(provider.verify('token', 'signup', '1.2.3.4')).resolves.toBe(
      true,
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get('secret')).toBe('secret');
    expect(body.get('response')).toBe('token');
    expect(body.get('remoteip')).toBe('1.2.3.4');
  });

  it.each([
    [
      'unsuccessful',
      { success: false, action: 'signup', hostname: 'example.com' },
    ],
    [
      'another action',
      { success: true, action: 'feedback', hostname: 'example.com' },
    ],
    [
      'another hostname',
      { success: true, action: 'signup', hostname: 'evil.com' },
    ],
    ['no hostname', { success: true, action: 'signup' }],
  ])('rejects a %s token', async (_, body) => {
    respond(body);

    await expect(provider.verify('token', 'signup')).resolves.toBe(false);
  });

  it.each([
    ['action', { success: true, action: 'feedback', hostname: 'example.com' }],
    [
      'hostname',
      { success: true, action: 'signup', hostname: 'www.example.com' },
    ],
  ])(
    'warns when a token passing siteverify has another %s',
    async (_, body) => {
      respond(body);

      await provider.verify('tok-1234', 'signup');

      expect(logger.warn).toHaveBeenCalledOnce();
      const [message] = vi.mocked(logger.warn).mock.calls[0] as [string];
      expect(message).toContain(String(body.action));
      expect(message).toContain(String(body.hostname));
      expect(message).not.toContain('tok-1234');
      expect(message).not.toContain(options.secret);
    },
  );

  it('does not warn about a token failing siteverify', async () => {
    respond({ success: false, 'error-codes': ['timeout-or-duplicate'] });

    await provider.verify('token', 'signup');

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'x'.repeat(2049), 42])(
    'rejects a malformed token without calling siteverify',
    async (token) => {
      await expect(provider.verify(token, 'signup')).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('rejects everything without an allowed hostname', async () => {
    await expect(
      new TurnstileProvider({ ...options, hostnames: [] }).verify(
        'token',
        'signup',
      ),
    ).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports an unreachable siteverify as unavailable', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    const error = await provider.verify('token', 'signup').catch((e) => e);
    expect(error).toBeInstanceOf(CaptchaUnavailableError);
    expect(error.message).toContain('fetch failed');
  });

  it('reports a failing siteverify as unavailable', async () => {
    respond({}, 500);

    const error = await provider.verify('token', 'signup').catch((e) => e);
    expect(error).toBeInstanceOf(CaptchaUnavailableError);
    expect(error.message).toContain('500');
  });

  it('reports a Cloudflare internal error as unavailable', async () => {
    respond({ success: false, 'error-codes': ['internal-error'] });

    await expect(provider.verify('token', 'signup')).rejects.toBeInstanceOf(
      CaptchaUnavailableError,
    );
  });

  it('reports a rejected secret as a fault, not an outage', async () => {
    respond({ success: false, 'error-codes': ['invalid-input-secret'] });

    const error = await provider.verify('token', 'signup').catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(CaptchaUnavailableError);
  });

  it('rejects a replayed token as a bot failure', async () => {
    respond({ success: false, 'error-codes': ['timeout-or-duplicate'] });

    await expect(provider.verify('token', 'signup')).resolves.toBe(false);
  });

  it('serves the site key, never the secret, to the client', () => {
    expect(provider.clientConfig).toEqual({
      driver: 'turnstile',
      siteKey: 'site-key',
    });
  });
});

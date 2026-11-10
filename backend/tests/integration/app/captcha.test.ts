import { describe, expect, it, vi } from 'vitest';
import { request } from '../utils/request.js';
import { resolve } from '#core/ioc/container';
import { CaptchaService } from '#core/captcha/captcha.service';
import { CaptchaUnavailableError } from '#core/captcha/captcha.provider';
import logger from '#core/logger';

function enableCaptcha(verify: CaptchaService['verify']) {
  const service = resolve(CaptchaService);
  vi.spyOn(service, 'enabled', 'get').mockReturnValue(true);
  return vi.spyOn(service, 'verify').mockImplementation(verify);
}

describe('/api/v1/captcha', () => {
  it('reports bot protection as disabled without a driver', async () => {
    const { body } = await request().get('/api/v1/captcha').expect(200);

    expect(body.data).toEqual({ driver: null });
  });
});

describe('captcha middleware', () => {
  const feedback = { message: 'This is a message' };

  it('passes a verified token through', async () => {
    const verify = enableCaptcha(async () => true);

    await request()
      .post('/api/v1/feedback/')
      .set('X-Captcha-Token', 'token')
      .send(feedback)
      .expect(204);

    expect(verify).toHaveBeenCalledWith('token', 'feedback', expect.anything());
  });

  it('rejects a failed check', async () => {
    enableCaptcha(async () => false);

    const { body } = await request()
      .post('/api/v1/feedback/')
      .send(feedback)
      .expect(403);

    expect(body.errorCode).toBe('CAPTCHA_FAILED');
  });

  it('reports an unreachable provider as unavailable', async () => {
    const warn = vi.spyOn(logger, 'warn');
    enableCaptcha(async () => {
      throw new CaptchaUnavailableError('down');
    });

    const { body } = await request()
      .post('/api/v1/feedback/')
      .send(feedback)
      .expect(503);

    expect(body.errorCode).toBe('CAPTCHA_UNAVAILABLE');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('down'));
  });
});

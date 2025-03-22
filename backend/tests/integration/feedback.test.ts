import { describe, expect, it } from 'vitest';
import { request } from '../utils/request';
import { NoOpMailer } from '../../src/core/mail/noop.mailer';

const mailer = NoOpMailer.prototype;

describe('/api/v1/feedback', () => {
  describe('POST /api/v1/feedback', () => {
    it('should respond with `201` status code', async () => {
      const data = {
        message: 'This is a message',
      };

      await request().post(`/api/v1/feedback/`).send(data).expect(204);

      expect(mailer.sendMail).toHaveBeenCalled();
    });
  });
});

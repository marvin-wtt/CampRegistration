import queueManager from '#core/queue/QueueManager';
import type { BuiltMail } from '#app/mail/mail.types';

export const mailQueue = queueManager.createQueue<
  BuiltMail,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  void,
  'send'
>('mail', {
  retryDelay: 1000 * 30,
  limit: {
    // TODO Read from config
    max: 49,
    duration: 1000 * 60 * 30, // 5 minutes
  },
});

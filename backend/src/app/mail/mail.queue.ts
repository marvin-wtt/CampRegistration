import queueManager from '#core/queue/QueueManager.js';
import type { AdvancedMailPayload } from '#app/mail/mail.types.js';

export const mailQueue = queueManager.createQueue<
  AdvancedMailPayload,
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

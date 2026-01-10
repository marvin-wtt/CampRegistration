import queueManager from '#core/queue/QueueManager';

export const mailQueue = queueManager.createQueue<unknown>('mail', {
  retryDelay: 1000 * 30,
  limit: {
    // TODO Read from config
    max: 49,
    duration: 1000 * 60 * 30, // 5 minutes
  },
});

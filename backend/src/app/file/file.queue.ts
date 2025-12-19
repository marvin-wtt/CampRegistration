import queueManager from '#core/queue/QueueManager.js';

type RequestFile = Express.Multer.File;

export const fileQueue = queueManager.createQueue<RequestFile>('file', {
  retryDelay: 1000 * 10,
});

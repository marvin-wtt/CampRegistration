import queueManager from '#core/queue/QueueManager.js';

type RequestFile = Express.Multer.File;

export const fileQueue = queueManager.createQueue<
  RequestFile,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  void,
  'upload'
>('file', {
  retryDelay: 1000 * 10,
});

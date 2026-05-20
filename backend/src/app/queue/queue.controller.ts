import { inject, injectable } from 'inversify';
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { BaseController } from '#core/base/BaseController';
import { QueueService } from './queue.service.js';
import { QueueResource } from './queue.resource.js';
import validator from './queue.validation.js';

@injectable()
export class QueueController extends BaseController {
  constructor(
    @inject(QueueService) private readonly queueService: QueueService,
  ) {
    super();
  }

  async index(_req: Request, res: Response) {
    const queues = await this.queueService.listQueues();

    res.resource(QueueResource.collection(queues));
  }

  async retryFailed(req: Request, res: Response) {
    const {
      params: { queue },
    } = await req.validate(validator.retryFailed);

    await this.queueService.retryFailed(queue);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async deleteFailed(req: Request, res: Response) {
    const {
      params: { queue },
    } = await req.validate(validator.deleteFailed);

    await this.queueService.deleteFailed(queue);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

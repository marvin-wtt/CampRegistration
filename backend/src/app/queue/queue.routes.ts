import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { QueueController } from './queue.controller.js';
import { controller } from '#core/router/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class QueueRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for queue routes
  }

  protected defineRoutes() {
    const queueController = resolve(QueueController);

    this.router.get('/', auth(), guard(), controller(queueController, 'index'));
    this.router.post(
      '/:queue/failed/retry',
      auth(),
      guard(),
      controller(queueController, 'retryFailed'),
    );
    this.router.delete(
      '/:queue/failed',
      auth(),
      guard(),
      controller(queueController, 'deleteFailed'),
    );
  }
}

import { FeedbackController } from './feedback.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { captcha } from '#core/captcha/captcha.middleware';
import { inject, injectable } from 'inversify';

@injectable()
export class FeedbackRouter extends ModuleRouter {
  constructor(
    @inject(FeedbackController)
    private readonly feedbackController: FeedbackController,
  ) {
    super();
  }

  protected registerBindings() {
    // No model bindings needed for feedback routes
  }

  protected defineRoutes() {
    this.router.post(
      '/',
      captcha('feedback'),
      controller(this.feedbackController, 'store'),
    );
  }
}

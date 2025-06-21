import feedbackController from './feedback.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';

export class FeedbackRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for feedback routes
  }

  protected defineRoutes() {
    this.router.post('/', controller(feedbackController, 'store'));
  }
}

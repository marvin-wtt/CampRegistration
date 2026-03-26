import { NewsletterManagerService } from './newsletter-manager.service.js';
import type { Request } from 'express';
import { resolve } from '#core/ioc/container';

export const newsletterManager = (
  req: Request,
): Promise<boolean | string> => {
  return (async () => {
    const userId = req.authUserId();
    const newsletterId = req.modelOrFail('newsletter').id;

    const managerService = resolve(NewsletterManagerService);
    const isManager =
      await managerService.isNewsletterManager(newsletterId, userId);

    return isManager;
  })();
};

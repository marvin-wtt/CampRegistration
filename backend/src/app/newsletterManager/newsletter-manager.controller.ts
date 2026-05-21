import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { NewsletterManagerService } from './newsletter-manager.service.js';
import { NewsletterManagerResource } from './newsletter-manager.resource.js';
import validator from './newsletter-manager.validation.js';
import { UserService } from '#app/user/user.service';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';

@injectable()
export class NewsletterManagerController extends BaseController {
  constructor(
    @inject(NewsletterManagerService)
    private readonly managerService: NewsletterManagerService,
    @inject(UserService) private readonly userService: UserService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    await req.validate(validator.index);

    const managers = await this.managerService.getManagers(newsletter.id);

    res.resource(NewsletterManagerResource.collection(managers));
  }

  async store(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    const { body } = await req.validate(validator.store);

    const user = await this.userService.getUserByEmail(body.email);
    if (!user) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'No user found with this email address.',
      );
    }

    const existing = await this.managerService.getManagerByUserId(
      newsletter.id,
      user.id,
    );
    if (existing) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User is already a newsletter manager.',
      );
    }

    const manager = await this.managerService.addManager(
      newsletter.id,
      user.id,
      body.role,
    );

    res
      .status(httpStatus.CREATED)
      .resource(new NewsletterManagerResource(manager));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { newsletterManagerId },
    } = await req.validate(validator.destroy);
    const newsletter = req.modelOrFail('newsletter');
    const target = req.modelOrFail('newsletterManager');

    if (target.role === 'OWNER') {
      const ownerCount = await this.managerService.countOwners(newsletter.id);
      if (ownerCount <= 1) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'The newsletter must always have at least one owner.',
        );
      }
    }

    await this.managerService.removeManager(newsletterManagerId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

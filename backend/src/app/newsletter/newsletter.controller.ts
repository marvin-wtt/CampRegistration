import httpStatus from 'http-status';
import { NewsletterService } from './newsletter.service.js';
import { NewsletterResource } from './newsletter.resource.js';
import validator from './newsletter.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';

@injectable()
export class NewsletterController extends BaseController {
  constructor(
    @inject(NewsletterService)
    private readonly newsletterService: NewsletterService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);
    const userId = req.authUserId();

    if (query?.view === 'all') {
      const { newsletters, nextCursor, limit, total } =
        await this.newsletterService.queryNewsletters(
          { name: query.name },
          {
            cursor: query.cursor,
            limit: query.limit,
            sortBy: query.sortBy,
            sortType: query.sortType,
          },
        );

      res.resource(
        NewsletterResource.collection(newsletters).withCursor(
          nextCursor,
          limit,
          total,
        ),
      );
      return;
    }

    const newsletters =
      await this.newsletterService.getNewslettersByUserId(userId);

    res.resource(NewsletterResource.collection(newsletters));
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const newsletter = req.modelOrFail('newsletter');

    res.resource(new NewsletterResource(newsletter));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const userId = req.authUserId();

    const newsletter = await this.newsletterService.createNewsletter(userId, {
      name: body.name,
      description: body.description,
      replyTo: body.replyTo,
    });

    res.status(httpStatus.CREATED).resource(new NewsletterResource(newsletter));
  }

  async update(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    const { body } = await req.validate(validator.update);

    const updated = await this.newsletterService.updateNewsletter(
      newsletter.id,
      {
        name: body.name,
        description: body.description,
        replyTo: body.replyTo,
      },
    );

    res.resource(new NewsletterResource(updated));
  }

  async destroy(req: Request, res: Response) {
    const newsletter = req.modelOrFail('newsletter');
    await req.validate(validator.destroy);

    await this.newsletterService.deleteNewsletter(newsletter.id);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

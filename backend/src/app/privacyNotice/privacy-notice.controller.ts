import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { PrivacyNoticeService } from './privacy-notice.service.js';
import {
  CampPrivacyNoticeResource,
  OrganizationPrivacyNoticeResource,
  PublishedPrivacyNoticeResource,
} from './privacy-notice.resource.js';
import validator from './privacy-notice.validation.js';

@injectable()
export class PrivacyNoticeController extends BaseController {
  constructor(
    @inject(PrivacyNoticeService)
    private readonly privacyNoticeService: PrivacyNoticeService,
  ) {
    super();
  }

  async show(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');

    const notice = await this.privacyNoticeService.getOrganizationNotice(
      organization.id,
    );

    res.resource(new OrganizationPrivacyNoticeResource(notice));
  }

  async update(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const {
      body: { content },
    } = await req.validate(validator.update);

    const notice = await this.privacyNoticeService.publishOrganizationNotice(
      organization.id,
      content,
    );

    res.resource(new OrganizationPrivacyNoticeResource(notice));
  }

  /** The camp's published addendum and the organization baseline it adds to. */
  async showCamp(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');

    const notice = await this.privacyNoticeService.getCampNotice(camp.id);

    res.resource(new CampPrivacyNoticeResource(notice));
  }

  async updateCamp(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const {
      body: { content },
    } = await req.validate(validator.updateCamp);

    const notice = await this.privacyNoticeService.publishCampAddendum(
      camp.id,
      content,
    );

    res.resource(new CampPrivacyNoticeResource(notice));
  }

  async showPublished(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');

    const notice = await this.privacyNoticeService.getPublishedNotice(camp.id);

    res.resource(new PublishedPrivacyNoticeResource(notice));
  }
}

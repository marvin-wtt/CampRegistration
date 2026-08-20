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

  async showOrganization(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');

    const notice = await this.privacyNoticeService.getOrganizationNotice(
      organization.id,
    );

    res.resource(new OrganizationPrivacyNoticeResource(notice));
  }

  async updateOrganization(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const {
      body: { content },
    } = await req.validate(validator.updateOrganization);

    const notice = await this.privacyNoticeService.publishOrganizationNotice(
      organization.id,
      content,
    );

    res.resource(new OrganizationPrivacyNoticeResource(notice));
  }

  /** The camp's published addendum and the organization baseline it adds to. */
  async showAddendum(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');

    const notice = await this.privacyNoticeService.getCampAddendum(
      camp.id,
      camp.organizationId,
    );

    res.resource(new CampPrivacyNoticeResource(notice));
  }

  async updateAddendum(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const {
      body: { content },
    } = await req.validate(validator.updateAddendum);

    const notice = await this.privacyNoticeService.publishCampAddendum(
      camp.id,
      camp.organizationId,
      content,
    );

    res.resource(new CampPrivacyNoticeResource(notice));
  }

  async showPublished(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');

    const notice = await this.privacyNoticeService.getPublishedNotice(
      camp.id,
      camp.organizationId,
    );

    res.resource(new PublishedPrivacyNoticeResource(notice));
  }
}

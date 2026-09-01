import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { PrivacyNoticeService } from './privacy-notice.service.js';
import {
  EventPrivacyNoticeResource,
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

  /** The event's published addendum and the organization baseline it adds to. */
  async showAddendum(req: Request, res: Response) {
    const event = req.modelOrFail('event');

    const notice = await this.privacyNoticeService.getEventAddendum(
      event.id,
      event.organizationId,
    );

    res.resource(new EventPrivacyNoticeResource(notice));
  }

  async updateAddendum(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { content },
    } = await req.validate(validator.updateAddendum);

    const notice = await this.privacyNoticeService.publishEventAddendum(
      event.id,
      event.organizationId,
      content,
    );

    res.resource(new EventPrivacyNoticeResource(notice));
  }

  async showPublished(req: Request, res: Response) {
    const event = req.modelOrFail('event');

    const notice = await this.privacyNoticeService.getPublishedNotice(
      event.id,
      event.organizationId,
    );

    res.resource(new PublishedPrivacyNoticeResource(notice));
  }
}

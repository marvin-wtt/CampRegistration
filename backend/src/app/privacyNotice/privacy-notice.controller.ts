import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { PrivacyNoticeService } from './privacy-notice.service.js';
import { OrganizationService } from '#app/organization/organization.service';
import { OrganizationReviewPendingMessage } from '#app/organization/organization.messages';
import { UserService } from '#app/user/user.service';
import type { Organization } from '#generated/prisma/client.js';
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
    @inject(OrganizationService)
    private readonly organizationService: OrganizationService,
    @inject(UserService) private readonly userService: UserService,
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

    // The notice was the one thing a draft lacked to be reviewed.
    const submitted = await this.organizationService.submitDraft(
      organization.id,
    );
    if (submitted) {
      await this.notifyReviewPending(submitted);
    }

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

  // Tells system administrators an organization is waiting on them.
  private async notifyReviewPending(organization: Organization) {
    const administrators = await this.userService.getAdministrators();

    await OrganizationReviewPendingMessage.enqueueBulk(
      administrators.map((recipient) => ({ organization, recipient })),
    );
  }
}

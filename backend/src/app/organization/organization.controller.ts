import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import { OrganizationService } from './organization.service.js';
import {
  OrganizationResource,
  OrganizationDetailsResource,
} from './organization.resource.js';
import type { Organization } from '#generated/prisma/client.js';
import validator from './organization.validation.js';
import { CampService } from '#app/camp/camp.service';
import { CampResource } from '#app/camp/camp.resource';
import { NewsletterService } from '#app/newsletter/newsletter.service';
import { NewsletterResource } from '#app/newsletter/newsletter.resource';
import { UserService } from '#app/user/user.service';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';
import {
  OrganizationReviewPendingMessage,
  OrganizationVerifiedMessage,
  OrganizationRejectedMessage,
} from './organization.messages.js';

@injectable()
export class OrganizationController extends BaseController {
  constructor(
    @inject(OrganizationService)
    private readonly organizationService: OrganizationService,
    @inject(CampService) private readonly campService: CampService,
    @inject(NewsletterService)
    private readonly newsletterService: NewsletterService,
    @inject(UserService) private readonly userService: UserService,
    @inject(OrganizationMemberService)
    private readonly organizationMemberService: OrganizationMemberService,
  ) {
    super();
  }

  /**
   * The organization's own camps.
   *
   * Organization administrators hold `camp.view` on every camp their
   * organization owns, but those camps carry no camp-manager record, so they
   * never appear under `GET /camps?view=assigned`. Without this listing the
   * permission would be unreachable — an administrator could open a camp only
   * via a direct link.
   */
  async camps(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const { query } = await req.validate(validator.camps);

    const { camps, nextCursor, limit, total } =
      await this.campService.queryCamps(
        { organizationId: organization.id },
        {
          cursor: query.cursor,
          limit: query.limit,
          sortBy: query.sortBy ?? 'startAt',
          sortType: query.sortType ?? 'desc',
        },
      );

    res.resource(
      CampResource.collection(camps).withCursor(nextCursor, limit, total),
    );
  }

  /**
   * The organization's own newsletters — the counterpart of `camps`, and
   * unreachable without it for the same reason: an administrator holds
   * `newsletter.view` on them but has no newsletter-manager record, so they
   * never appear under `GET /newsletters`.
   */
  async newsletters(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const { query } = await req.validate(validator.newsletters);

    const { newsletters, nextCursor, limit, total } =
      await this.newsletterService.queryNewsletters(
        { organizationId: organization.id },
        {
          cursor: query.cursor,
          limit: query.limit,
          sortBy: query.sortBy ?? 'createdAt',
          sortType: query.sortType ?? 'desc',
        },
      );

    res.resource(
      NewsletterResource.collection(newsletters).withCursor(
        nextCursor,
        limit,
        total,
      ),
    );
  }

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);
    const userId = req.authUserId();

    // `view=all` is the administrators' moderation queue; the route guard
    // restricts it to them.
    if (query?.view === 'all') {
      const { organizations, nextCursor, limit, total } =
        await this.organizationService.queryOrganizations(
          { name: query.name, verificationStatus: query.status },
          {
            cursor: query.cursor,
            limit: query.limit,
            sortBy: query.sortBy,
            sortType: query.sortType,
          },
        );

      res.resource(
        OrganizationResource.collection(organizations).withCursor(
          nextCursor,
          limit,
          total,
        ),
      );
      return;
    }

    const organizations =
      await this.organizationService.getOrganizationsByUserId(userId);

    res.resource(OrganizationResource.collection(organizations));
  }

  async show(req: Request, res: Response) {
    await req.validate(validator.show);
    const organization = req.modelOrFail('organization');

    res.resource(await this.toDetailsResource(organization));
  }

  /**
   * Alerts every system administrator that an organization is waiting on a
   * decision. Enqueued, so a slow or unreachable mail server never fails the
   * request that triggered it.
   */
  private async notifyReviewPending(organization: Organization) {
    const administrators = await this.userService.getAdministrators();

    await OrganizationReviewPendingMessage.enqueueBulk(
      administrators.map((recipient) => ({ organization, recipient })),
    );
  }

  /**
   * Every single-organization response carries what it owns, so the client can
   * explain up front why deleting is blocked instead of only finding out from
   * the rejected request. Kept off the list response — it is a query per row.
   */
  private async toDetailsResource(organization: Organization) {
    const { camps, newsletters } =
      await this.organizationService.countOwnedResources(organization.id);

    return new OrganizationDetailsResource({
      ...organization,
      ownedCamps: camps,
      ownedNewsletters: newsletters,
    });
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const userId = req.authUserId();

    const organization = await this.organizationService.createOrganization(
      userId,
      body,
    );

    await this.notifyReviewPending(organization);

    res
      .status(httpStatus.CREATED)
      .resource(await this.toDetailsResource(organization));
  }

  async update(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const { body } = await req.validate(validator.update);

    const updated = await this.organizationService.updateOrganization(
      organization,
      body,
    );

    // An edit that re-opens review puts it back in the moderators' queue.
    if (
      updated.verificationStatus === 'PENDING' &&
      organization.verificationStatus !== 'PENDING'
    ) {
      await this.notifyReviewPending(updated);
    }

    res.resource(await this.toDetailsResource(updated));
  }

  async destroy(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    await req.validate(validator.destroy);

    const { camps, newsletters } =
      await this.organizationService.countOwnedResources(organization.id);
    if (camps > 0 || newsletters > 0) {
      // Carries a stable code so the client can explain what is blocking
      // rather than parsing this sentence.
      throw new ApiError(
        httpStatus.CONFLICT,
        `The organization still owns ${camps.toString()} camp(s) and ${newsletters.toString()} newsletter(s). Move or delete them first.`,
        { code: 'ORGANIZATION_NOT_EMPTY' },
      );
    }

    await this.organizationService.deleteOrganization(organization.id);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async submitVerification(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    await req.validate(validator.submitVerification);

    if (organization.verificationStatus !== 'REJECTED') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Only a rejected organization can be resubmitted for verification.',
      );
    }

    const updated = await this.organizationService.resubmitForVerification(
      organization.id,
    );

    await this.notifyReviewPending(updated);

    res.resource(await this.toDetailsResource(updated));
  }

  async review(req: Request, res: Response) {
    const organization = req.modelOrFail('organization');
    const {
      body: { status, reviewNote },
    } = await req.validate(validator.review);
    const reviewerUserId = req.authUserId();

    // Reviewable from any state, not just PENDING: a verified organization can
    // turn out to be fraudulent and must be revocable, and a rejected one can
    // be reinstated without waiting for it to resubmit.
    const updated = await this.organizationService.applyVerificationDecision(
      organization.id,
      reviewerUserId,
      status,
      reviewNote,
    );

    // Tell the organization the outcome — the reviewer already knows it.
    const recipients =
      await this.organizationMemberService.getAdministratorRecipients(
        organization.id,
      );
    const payloads = recipients.map((recipient) => ({
      organization: updated,
      recipient,
    }));

    if (status === 'VERIFIED') {
      await OrganizationVerifiedMessage.enqueueBulk(payloads);
    } else {
      await OrganizationRejectedMessage.enqueueBulk(payloads);
    }

    res.resource(await this.toDetailsResource(updated));
  }
}

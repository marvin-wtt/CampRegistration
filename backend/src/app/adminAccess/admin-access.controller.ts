import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { TotpService } from '#app/totp/totp.service';
import { AdminAccessService } from '#app/adminAccess/admin-access.service';
import {
  AdminAccessGrantResource,
  AdminAccessGrantReviewResource,
} from '#app/adminAccess/admin-access.resource';
import validator from '#app/adminAccess/admin-access.validation';

@injectable()
export class AdminAccessController extends BaseController {
  constructor(
    @inject(AdminAccessService)
    private readonly adminAccessService: AdminAccessService,
    @inject(TotpService) private readonly totpService: TotpService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const {
      query: { cursor, limit, ...filter },
    } = await req.validate(validator.index);

    const { grants, nextCursor, total, ...rest } =
      await this.adminAccessService.queryGrants(filter, { cursor, limit });

    res.resource(
      AdminAccessGrantReviewResource.collection(grants).withCursor(
        nextCursor,
        rest.limit,
        total,
      ),
    );
  }

  async store(req: Request, res: Response) {
    const {
      body: { otp, ...input },
    } = await req.validate(validator.store);
    const userId = req.authUserId();

    // Confirmed in person, so a stolen session alone opens nothing.
    await this.totpService.verifyTwoFactor(userId, otp);
    const grant = await this.adminAccessService.grant(userId, input);

    res
      .status(httpStatus.CREATED)
      .resource(new AdminAccessGrantResource(grant));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { grantId },
    } = await req.validate(validator.destroy);

    await this.adminAccessService.end(req.authUserId(), grantId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

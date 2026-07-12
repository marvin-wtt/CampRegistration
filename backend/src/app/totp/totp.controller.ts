import { UserService } from '#app/user/user.service';
import { TotpService } from './totp.service.js';
import httpStatus from 'http-status';
import validator from './totp.validation.js';
import { TotpResource, TotpRecoveryCodesResource } from './totp.resource.js';
import ApiError from '#utils/ApiError';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { isPasswordMatch } from '#core/encryption';
import { inject, injectable } from 'inversify';

@injectable()
export class TotPController extends BaseController {
  constructor(
    @inject(UserService) private readonly userService: UserService,
    @inject(TotpService) private readonly totpService: TotpService,
  ) {
    super();
  }

  async setup(req: Request, res: Response) {
    const {
      body: { password },
    } = await req.validate(validator.setup);

    const userId = req.authUserId();
    const user = await this.userService.getUserByIdOrFail(userId);

    // Verify password
    const match = await isPasswordMatch(password, user.password);
    if (!match) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid password');
    }

    // Prevent reset
    if (user.twoFactorEnabled) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Two factor authentication already enabled.',
      );
    }

    const totp = await this.totpService.generateTOTP(user);

    res.resource(new TotpResource(totp));
  }

  async enable(req: Request, res: Response) {
    const {
      body: { otp },
    } = await req.validate(validator.enable);
    const userId = req.authUserId();
    const user = await this.userService.getUserByIdOrFail(userId);

    await this.totpService.validateTOTP(user, otp);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async disable(req: Request, res: Response) {
    const {
      body: { password, otp },
    } = await req.validate(validator.disable);

    const userId = req.authUserId();
    const user = await this.userService.getUserByIdOrFail(userId);

    // Verify password
    const match = await isPasswordMatch(password, user.password);
    if (!match) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid password');
    }

    if (!user.twoFactorEnabled) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Two factor authentication not enabled.',
      );
    }

    // Verify the second factor — accept a TOTP token or a recovery code so a
    // user who lost their authenticator can still turn 2FA off.
    await this.totpService.verifyTwoFactor(user, otp);

    // Disable
    await this.totpService.disableTOTP(user);

    res.status(httpStatus.NO_CONTENT).end();
  }

  async generateRecoveryCodes(req: Request, res: Response) {
    const {
      body: { password, otp },
    } = await req.validate(validator.generateRecoveryCodes);

    const userId = req.authUserId();
    const user = await this.userService.getUserByIdOrFail(userId);

    // Verify password
    const match = await isPasswordMatch(password, user.password);
    if (!match) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid password');
    }

    if (!user.twoFactorEnabled) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Two factor authentication not enabled.',
      );
    }

    // Require the second factor — minting new recovery codes creates fresh
    // credentials that bypass the authenticator, so it must be as protected as
    // disabling 2FA. Accept a TOTP token or an existing recovery code.
    await this.totpService.verifyTwoFactor(user, otp);

    const codes = await this.totpService.generateRecoveryCodes(user);

    res.resource(new TotpRecoveryCodesResource(codes));
  }
}

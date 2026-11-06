import { UserService } from '#app/user/user.service';
import { TotpService } from '#app/totp/totp.service';
import { PasskeyService } from './passkey.service.js';
import httpStatus from 'http-status';
import validator from './passkey.validation.js';
import { PasskeyOptionsResource, PasskeyResource } from './passkey.resource.js';
import ApiError from '#utils/ApiError';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { isPasswordMatch } from '#core/encryption';
import { inject, injectable } from 'inversify';

@injectable()
export class PasskeyController extends BaseController {
  constructor(
    @inject(UserService) private readonly userService: UserService,
    @inject(TotpService) private readonly totpService: TotpService,
    @inject(PasskeyService) private readonly passkeyService: PasskeyService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const passkeys = await this.passkeyService.getPasskeysByUserId(
      req.authUserId(),
    );

    res.resource(PasskeyResource.collection(passkeys));
  }

  async registrationOptions(req: Request, res: Response) {
    const {
      body: { password, otp },
    } = await req.validate(validator.registrationOptions);

    const user = await this.verifyCredentials(req.authUserId(), password, otp);

    const options = await this.passkeyService.generateRegistrationOptions(user);

    res.resource(new PasskeyOptionsResource(options));
  }

  async registrationVerify(req: Request, res: Response) {
    const {
      body: { response, name },
    } = await req.validate(validator.registrationVerify);

    // No re-authentication here: the challenge is bound to the user and only
    // issued after `registrationOptions` verified their credentials.
    const user = await this.userService.getUserByIdOrFail(req.authUserId());
    const passkey = await this.passkeyService.verifyRegistration(
      user,
      response,
      name,
    );

    res.status(httpStatus.CREATED).resource(new PasskeyResource(passkey));
  }

  async update(req: Request, res: Response) {
    const {
      params: { passkeyId },
      body: { name },
    } = await req.validate(validator.update);

    const passkey = await this.passkeyService.renamePasskey(
      req.authUserId(),
      passkeyId,
      name,
    );

    res.resource(new PasskeyResource(passkey));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { passkeyId },
      body: { password, otp },
    } = await req.validate(validator.destroy);

    const user = await this.verifyCredentials(req.authUserId(), password, otp);

    await this.passkeyService.deletePasskey(user.id, passkeyId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  // Changing how an account can sign in requires the same proof as signing
  // in with a password: the password, plus the second factor when enabled.
  private async verifyCredentials(
    userId: string,
    password: string,
    otp: string | undefined,
  ) {
    const user = await this.userService.getUserByIdOrFail(userId);

    const match = await isPasswordMatch(password, user.password);
    if (!match) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid password');
    }

    if (await this.totpService.isTwoFactorEnabled(user.id)) {
      if (!otp) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'OTP required');
      }

      await this.totpService.verifyTwoFactor(user.id, otp);
    }

    return user;
  }
}

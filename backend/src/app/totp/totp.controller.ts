import userService from '#app/user/user.service';
import totpService from './totp.service.js';
import httpStatus from 'http-status';
import validator from './totp.validation.js';
import { TotpResource } from './totp.resource.js';
import ApiError from '#utils/ApiError';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/BaseController';
import { isPasswordMatch } from '#core/encryption';

class TotPController extends BaseController {
  async setup(req: Request, res: Response) {
    const {
      body: { password },
    } = await req.validate(validator.setup);

    const userId = req.authUserId();
    const user = await userService.getUserByIdOrFail(userId);

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

    const totp = await totpService.generateTOTP(user);

    res.resource(new TotpResource(totp));
  }

  async enable(req: Request, res: Response) {
    const {
      body: { otp },
    } = await req.validate(validator.enable);
    const userId = req.authUserId();
    const user = await userService.getUserByIdOrFail(userId);

    await totpService.validateTOTP(user, otp);

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  async disable(req: Request, res: Response) {
    const {
      body: { password, otp },
    } = await req.validate(validator.disable);

    const userId = req.authUserId();
    const user = await userService.getUserByIdOrFail(userId);

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

    // Verify TOTP
    totpService.verifyTOTP(user, otp);

    // Disable
    await totpService.disableTOTP(user);

    res.status(httpStatus.NO_CONTENT).end();
  }
}

export default new TotPController();

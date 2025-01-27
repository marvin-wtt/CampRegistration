import userService from '#app/user/user.service';
import authService from '#app/auth/auth.service';
import totpService from './totp.service.js';
import httpStatus from 'http-status';
import { resource } from '#core/resource';
import validator from './totp.validation.js';
import totpResource from './totp.resource.js';
import ApiError from '#utils/ApiError.js';
import { type Request, type Response } from 'express';

const setup = async (req: Request, res: Response) => {
  const {
    body: { password },
  } = await req.validate(validator.setup);

  const userId = req.authUserId();
  const user = await userService.getUserByIdOrFail(userId);

  // Verify password
  const match = await authService.isPasswordMatch(password, user.password);
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

  res.json(resource(totpResource(totp)));
};

const enable = async (req: Request, res: Response) => {
  const {
    body: { otp },
  } = await req.validate(validator.enable);
  const userId = req.authUserId();
  const user = await userService.getUserByIdOrFail(userId);

  await totpService.validateTOTP(user, otp);

  res.sendStatus(httpStatus.NO_CONTENT);
};

const disable = async (req: Request, res: Response) => {
  const {
    body: { password, otp },
  } = await req.validate(validator.disable);

  const userId = req.authUserId();
  const user = await userService.getUserByIdOrFail(userId);

  // Verify password
  const match = await authService.isPasswordMatch(password, user.password);
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
  await totpService.verifyTOTP(user, otp);

  // Disable
  await totpService.disableTOTP(user);

  res.status(httpStatus.NO_CONTENT).end();
};

export default {
  setup,
  enable,
  disable,
};

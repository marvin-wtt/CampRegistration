import { catchRequestAsync } from '#utils/catchAsync';
import userService from '#app/user/user.service';
import authService from '#app/auth/auth.service';
import totpService from './totp.service.js';
import httpStatus from 'http-status';
import { authUserId } from '#utils/authUserId';
import { resource } from '#core/resource';
import { validateRequest } from '#core/validation/request';
import validator from './totp.validation.js';
import totpResource from './totp.resource.js';
import ApiError from '#utils/ApiError.js';

const setup = catchRequestAsync(async (req, res) => {
  const {
    body: { password },
  } = await validateRequest(req, validator.setup);

  const userId = authUserId(req);
  const user = await userService.getUserByIdOrFail(userId);

  // Verify password
  const match = await authService.isPasswordMatch(password, user.password);
  if (!match) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid password');
  }

  const totp = await totpService.generateTOTP(user);

  res.json(resource(totpResource(totp)));
});

const enable = catchRequestAsync(async (req, res) => {
  const {
    body: { totp },
  } = await validateRequest(req, validator.enable);
  const userId = authUserId(req);
  const user = await userService.getUserByIdOrFail(userId);

  await totpService.validateTOTP(user, totp);

  res.sendStatus(httpStatus.NO_CONTENT);
});

const disable = catchRequestAsync(async (req, res) => {
  const {
    body: { password, totp },
  } = await validateRequest(req, validator.disable);

  const userId = authUserId(req);
  const user = await userService.getUserByIdOrFail(userId);

  // Verify password
  const match = await authService.isPasswordMatch(password, user.password);
  if (!match) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid password');
  }

  // Verify TOTP
  await totpService.verifyTOTP(user, totp);

  // Disable
  await totpService.disableTOTP(user);

  res.status(httpStatus.NO_CONTENT).end();
});

export default {
  setup,
  enable,
  disable,
};

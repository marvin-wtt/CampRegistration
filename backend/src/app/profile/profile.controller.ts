import { catchRequestAsync } from '#utils/catchAsync';
import tokenService from '#app/token/token.service';
import userService from '#app/user/user.service';
import authService from '#app/auth/auth.service';
import campService from '#app/camp/camp.service';
import httpStatus from 'http-status';
import { authUserId } from '#utils/authUserId';
import { resource } from '#core/resource';
import profileResource from './profile.resource.js';
import { validateRequest } from '#core/validation/request';
import validator from './profile.validation.js';

const show = catchRequestAsync(async (req, res) => {
  const userId = authUserId(req);
  const user = await userService.getUserByIdWithCamps(userId);

  const camps = user.camps.map((value) => {
    return value.camp;
  });

  res.json(resource(profileResource(user, camps)));
});

const update = catchRequestAsync(async (req, res) => {
  const {
    body: { name, email, password, locale },
  } = await validateRequest(req, validator.update);
  const userId = authUserId(req);

  // Mark email as unverified if it is updated
  const emailVerified = email !== undefined ? false : undefined;
  const user = await userService.updateUserById(userId, {
    name,
    email,
    password,
    locale,
    emailVerified,
  });

  if (password || email) {
    await authService.logoutAllDevices(userId);
  }

  if (emailVerified === false) {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await authService.sendVerificationEmail(user.email, verifyEmailToken);
  }

  const camps = await campService.getCampsByUserId(userId);

  res.json(resource(profileResource(user, camps)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const userId = authUserId(req);

  await userService.deleteUserById(userId);

  res.status(httpStatus.NO_CONTENT).end();
});

export default {
  show,
  update,
  destroy,
};

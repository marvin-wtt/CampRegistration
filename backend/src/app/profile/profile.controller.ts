import tokenService from '#app/token/token.service';
import userService from '#app/user/user.service';
import authService from '#app/auth/auth.service';
import campService from '#app/camp/camp.service';
import httpStatus from 'http-status';
import { authUserId } from '#utils/authUserId';
import { resource } from '#core/resource';
import profileResource from './profile.resource.js';
import validator from './profile.validation.js';
import ApiError from '#utils/ApiError.js';
import { type Request, type Response } from 'express';

const show = async (req: Request, res: Response) => {
  const userId = authUserId(req);
  const user = await userService.getUserByIdWithCamps(userId);

  const camps = user.camps.map((value) => {
    return value.camp;
  });

  res.json(resource(profileResource(user, camps)));
};

const update = async (req: Request, res: Response) => {
  const {
    body: { name, email, password, currentPassword, locale },
  } = await req.validate(validator.update);
  const userId = authUserId(req);

  // Verify currentPassword matches
  if (currentPassword) {
    const user = await userService.getUserByIdOrFail(userId);
    const match = await authService.isPasswordMatch(
      currentPassword,
      user.password,
    );

    if (!match) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid password');
    }
  }

  // Mark email as unverified if it is updated
  const emailVerified = email !== undefined ? false : undefined;
  const user = await userService.updateUserById(userId, {
    name,
    email,
    password,
    locale,
    emailVerified,
  });

  // Logout devices
  if (password || email) {
    await authService.revokeAllUserTokens(userId);
  }

  // Send email verification
  if (emailVerified === false) {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await authService.sendVerificationEmail(user.email, verifyEmailToken);
  }

  const camps = await campService.getCampsByUserId(userId);

  res.json(resource(profileResource(user, camps)));
};

const destroy = async (req: Request, res: Response) => {
  const userId = authUserId(req);

  await userService.deleteUserById(userId);

  // Clear auth cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(httpStatus.NO_CONTENT).end();
};

export default {
  show,
  update,
  destroy,
};

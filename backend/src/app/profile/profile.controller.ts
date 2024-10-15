import tokenService from 'app/token/token.service';
import userService from 'app/user/user.service';
import authService from 'app/auth/auth.service';
import campService from 'app/camp/camp.service';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { authUserId } from 'utils/authUserId';
import { resource } from 'app/resource';
import profileResource from './profile.resource';
import type { ProfileUpdateData } from '@camp-registration/common/entities';
import { Request, Response } from 'express';

const show = async (req: Request, res: Response) => {
  const userId = authUserId(req);
  const user = await userService.getUserByIdWithCamps(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const camps = user.camps.map((value) => {
    return value.camp;
  });

  res.json(resource(profileResource(user, camps)));
};

const update = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, email, password, locale } = req.body as ProfileUpdateData;

  // Mark email as unverified if it is updated
  const emailVerified = email !== undefined ? false : undefined;
  const user = await userService.updateUserById(userId, {
    name,
    email,
    password,
    locale,
    emailVerified,
  });

  if (password) {
    await authService.logoutAllDevices(userId);
  }

  if (emailVerified === false) {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await authService.sendVerificationEmail(user.email, verifyEmailToken);
  }

  const camps = await campService.getCampsByUserId(userId);

  res.json(resource(profileResource(user, camps)));
};

export default {
  show,
  update,
};

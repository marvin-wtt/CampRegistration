import tokenService from '#app/token/token.service';
import userService from '#app/user/user.service';
import authService from '#app/auth/auth.service';
import campService from '#app/camp/camp.service';
import httpStatus from 'http-status';
import { ProfileResource } from './profile.resource.js';
import validator from './profile.validation.js';
import ApiError from '#utils/ApiError';
import { type Request, type Response } from 'express';
import { VerifyEmailMessage } from '#app/auth/auth.messages';
import { BaseController } from '#core/base/BaseController';
import { isPasswordMatch } from '#core/encryption';

class ProfileController extends BaseController {
  async show(req: Request, res: Response) {
    const userId = req.authUserId();
    const user = await userService.getUserByIdWithCamps(userId);

    res.resource(new ProfileResource(user));
  }

  async update(req: Request, res: Response) {
    const {
      body: { name, email, password, currentPassword, locale },
    } = await req.validate(validator.update);
    const userId = req.authUserId();

    // Verify currentPassword matches
    if (currentPassword) {
      const user = await userService.getUserByIdOrFail(userId);
      const match = await isPasswordMatch(currentPassword, user.password);

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
      const verifyEmailToken =
        await tokenService.generateVerifyEmailToken(user);

      VerifyEmailMessage.enqueue({
        user,
        token: verifyEmailToken,
      });
    }

    const camps = await campService.getCampsByUserId(userId);

    res.resource(new ProfileResource({ ...user, camps }));
  }

  async destroy(req: Request, res: Response) {
    const userId = req.authUserId();

    await userService.deleteUserById(userId);

    // Clear auth cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(httpStatus.NO_CONTENT).end();
  }
}

export default new ProfileController();

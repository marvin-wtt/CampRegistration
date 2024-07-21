import { catchRequestAsync } from 'utils/catchAsync';
import { tokenService, userService, authService } from 'services';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { authUserId } from 'utils/authUserId';
import { resource } from 'resources/resource';
import { profileResource } from 'resources';

const show = catchRequestAsync(async (req, res) => {
  const userId = authUserId(req);
  const user = await userService.getUserByIdWithCamps(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const camps = user.camps.map((value) => {
    return value.camp;
  });

  res.json(resource(profileResource(user, camps)));
});

const update = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  const { name, email, password, locale } = req.body;

  // Mark email as unverified if it is updated
  const emailVerified = email !== undefined ? true : undefined;
  const user = await userService.updateUserByIdWithCamps(userId, {
    name,
    email,
    password,
    locale,
    emailVerified,
  });

  if (password) {
    await authService.logoutAllDevices(userId);
  }

  if (emailVerified) {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await authService.sendVerificationEmail(user.email, verifyEmailToken);
  }

  const camps = user.camps.map((value) => {
    return value.camp;
  });

  res.json(resource(profileResource(user, camps)));
});

export default {
  show,
  update,
};

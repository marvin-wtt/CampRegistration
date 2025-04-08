import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { type Request } from 'express';
import { catchMiddlewareAsync } from '#utils/catchAsync';

export const authUserId = (req: Request): string | never => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!req.isAuthenticated() || req.user == undefined) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const user = req.user as { id: string };

  return user.id;
};

export const auth = () => {
  return catchMiddlewareAsync((req: Request) => {
    if (req.isUnauthenticated()) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthenticated');
    }
  });
};

export const guest = () => {
  return catchMiddlewareAsync((req: Request) => {
    if (req.isAuthenticated()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Authenticated');
    }
  });
};

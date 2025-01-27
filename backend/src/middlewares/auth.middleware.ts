import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import { NextFunction, type Request, Response } from 'express';
import { catchMiddlewareAsync } from '#utils/catchAsync';

export default (req: Request, _res: Response, next: NextFunction) => {
  req.authUserId = () => {
    if (!req.isAuthenticated() || req.user === undefined) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const user = req.user as { id: string };

    return user.id;
  };

  next();
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

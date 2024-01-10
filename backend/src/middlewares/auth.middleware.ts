import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { NextFunction, Request, Response } from 'express';

export const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Unauthenticated'));
    }
  };
};

export const guest = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.isUnauthenticated()) {
      next();
    } else {
      next(new ApiError(httpStatus.FORBIDDEN, 'Authenticated'));
    }
  };
};

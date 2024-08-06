import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { Request, Response } from 'express';
import { catchMiddlewareAsync } from '../utils/catchAsync';

export const auth = () => {
  return catchMiddlewareAsync((req: Request, res: Response) => {
    if (req.isUnauthenticated()) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthenticated');
    }
  });
};

export const guest = () => {
  return catchMiddlewareAsync((req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Authenticated');
    }
  });
};

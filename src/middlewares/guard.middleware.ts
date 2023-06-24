import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

/**
 * Middleware to guard the access to a route.
 * At least one guard must be true to gain access.
 * Administrations always have access.
 *
 * @param fns The guard function or an empty array if only administrators should have access
 */
const guard = (fns: ((req: Request) => Promise<boolean | string>)[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // TODO Check if admin - if yes return true here

    let message = "Insufficient permissions";
    for (const fn of fns) {
      const result = await fn(req);

      if (result === true) {
        next();
        return;
      }

      if (typeof result === "string") {
        message = result;
      }
    }

    next(new ApiError(httpStatus.FORBIDDEN, message));
  };
};
export default guard;

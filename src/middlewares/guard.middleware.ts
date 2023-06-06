import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

const guard =
  (fn: (req: Request) => Promise<boolean | string>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // TODO Check if admin - if yes return true here

    const result = await fn(req);

    if (result === true) {
      next();
      return;
    }

    const message =
      typeof result === "string" ? result : "Insufficient permissions";

    next(new ApiError(httpStatus.FORBIDDEN, message));
  };

export default guard;

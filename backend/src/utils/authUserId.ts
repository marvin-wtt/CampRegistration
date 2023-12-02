import { Request } from "express";
import ApiError from "./ApiError";
import httpStatus from "http-status";

export const authUserId = (req: Request): string | never => {
  return authUser(req).id;
};

export const authUser = (req: Request): { id: string } | never => {
  if (!req.isAuthenticated() || req.user === undefined) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }

  return req.user;
};

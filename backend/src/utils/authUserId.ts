import { Request } from "express";
import ApiError from "./ApiError";
import httpStatus from "http-status";
import { User } from "@prisma/client";

export const authUserId = (req: Request): string | never => {
  return authUser(req).id;
};

export const authUser = (req: Request): User | never => {
  if (!req.isAuthenticated() || req.user === undefined) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }

  return req.user;
};

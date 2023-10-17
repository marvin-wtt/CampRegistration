import { Request } from "express";
import ApiError from "./ApiError";
import httpStatus from "http-status";

const authUserId = (req: Request): string | never => {
  if (
    req.isAuthenticated() &&
    req.user !== undefined &&
    "id" in req.user &&
    typeof req.user.id === "string"
  ) {
    return req.user.id;
  }

  throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
};

export default authUserId;

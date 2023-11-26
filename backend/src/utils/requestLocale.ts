import { Request } from "express";

export const requestLocale = (req: Request): string => {
  return req.acceptsLanguages()[0];
};

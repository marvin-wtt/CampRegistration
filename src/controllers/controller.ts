import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

export abstract class Controller {
  async index(req: Request, res: Response, next: NextFunction): Promise<any> {
    next(new ApiError(httpStatus.NOT_IMPLEMENTED, ""));
  }

  async show(req: Request, res: Response, next: NextFunction): Promise<any> {
    next(new ApiError(httpStatus.NOT_IMPLEMENTED, ""));
  }

  async store(req: Request, res: Response, next: NextFunction): Promise<any> {
    next(new ApiError(httpStatus.NOT_IMPLEMENTED, ""));
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<any> {
    next(new ApiError(httpStatus.NOT_IMPLEMENTED, ""));
  }

  async destroy(req: Request, res: Response, next: NextFunction): Promise<any> {
    next(new ApiError(httpStatus.NOT_IMPLEMENTED, ""));
  }
}

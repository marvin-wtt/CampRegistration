import { Request, Response, NextFunction } from "express-serve-static-core";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import {error} from "winston";

interface Resolver {
  [key: string]: any;
}

// TODO Move out of middleware
const resolver: Resolver = {
  user: prisma.user,
  camp: prisma.camp,
  registration: prisma.registration,
  template: prisma.template,
  room: prisma.room,
  token: prisma.token,
};

const bindRouteModels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    for (const [paramName, modelId] of Object.entries(req.params)) {
      if (!paramName.endsWith("Id")) {
        continue;
      }

      const modelName = paramName.slice(0, -2);

      if (!(modelName in resolver)) {
        next(
          new ApiError(500, `No model matches request parameter ${modelName}`)
        );
      }


      let model = undefined;
      try {
        model = await resolver[modelName].findFirst({
          where: {id: modelId},
        });
      } catch (error) {
        next(new ApiError(500, "Failed to resolve model"));
      }

      if (model == null) {
        next(new ApiError(404, `${modelName} with id ${modelId} not found`));
      }

      // @ts-expect-error Name must be valid
      req.models[modelName] = model ?? undefined;
    }

    next();
  } catch (error: unknown) {
    next(error);
  }
};

export default bindRouteModels;

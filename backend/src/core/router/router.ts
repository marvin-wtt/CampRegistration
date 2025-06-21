import express, {
  type Request,
  type Router,
  type RouterOptions,
} from 'express';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import type { AppRouter } from '#core/base/AppModule';

type Models = Request['models'];
type ModelKeys = keyof Models;

type ModelHandler<T extends ModelKeys> = (
  req: Request,
  value: string,
) => Models[T] | null | Promise<Models[T] | null>;

type HandlerMap = {
  [K in ModelKeys]: ModelHandler<K>;
};

const handlers: Partial<HandlerMap> = {};
const routers: Router[] = [];

/**
 * Creates an express router with all registered models applied to it
 * @param options
 */
export function createRouter(
  options: RouterOptions = {
    mergeParams: true,
  },
): AppRouter {
  const router = express.Router(options) as AppRouter;
  router.useRouter = (path, moduleRouter) => {
    router.use(path, moduleRouter.router);
  };

  Object.keys(handlers).forEach((model) => {
    applyBinding(router, model as ModelKeys);
  });

  routers.push(router);

  return router;
}

/**
 * Registers a model binding for the current router and all future routers
 * @param name Name of the model
 * @param handler Function to resolve the model
 */
export function registerRouteModelBinding<T extends ModelKeys>(
  name: T,
  handler: ModelHandler<T>,
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  handlers[name] = handler;

  // Apply binding to all already registered routers
  for (const r of routers) {
    applyBinding(r, name);
  }
}

function applyBinding(router: Router, model: keyof Request['models']) {
  router.param(`${model}Id`, async (req, _res, next, value) => {
    /* c8 ignore next */
    if (typeof value !== 'string') {
      next(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid request param value for param ${model}.`,
        ),
      );
      return;
    }

    const handler = handlers[model];
    if (!handler) {
      next(
        new ApiError(
          httpStatus.NOT_FOUND,
          `No handler registered for model ${String(model)}.`,
        ),
      );
      return;
    }

    const result = await handler(req, value);
    req.setModelOrFail(model, result);
    next();
  });
}

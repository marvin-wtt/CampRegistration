import express, {
  type Request,
  type Router,
  type RouterOptions,
} from 'express';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import type { AppRouter } from '#core/base/AppModule';

type Models = Request['models'];
export type ModelKey = keyof Models;

export type ModelHandler<T extends ModelKey> = (
  req: Request,
  value: string,
) => Models[T] | null | Promise<Models[T] | null>;

type HandlerMap = {
  [K in ModelKey]: ModelHandler<K>;
};

const handlers: Partial<HandlerMap> = {};
const routers: AppRouter[] = [];

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
    moduleRouter.build();
    router.use(path, moduleRouter.router);
  };

  Object.entries(handlers).forEach(([model, handler]) => {
    applyBinding(router, model as ModelKey, handler);
  });

  routers.push(router);

  return router;
}

/**
 * Registers a model binding for the current router and all future routers
 * @param name Name of the model
 * @param handler Function to resolve the model
 */
export function registerRouteModelBinding<T extends ModelKey>(
  name: T,
  handler: ModelHandler<T>,
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  handlers[name] = handler;

  // Apply binding to all already registered routers
  for (const r of routers) {
    applyBinding(r, name, handler);
  }
}

export function applyBinding<T extends ModelKey>(
  router: Router,
  model: T,
  handler: ModelHandler<T>,
) {
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

    const result = await handler(req, value);
    req.setModelOrFail(model, result);
    next();
  });
}

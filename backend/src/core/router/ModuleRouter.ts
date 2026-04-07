import type { RequestHandler, Router } from 'express';
import {
  createRouter,
  type ModelKey,
  type ModelHandler,
  registerRouteModelBinding,
  applyBinding,
} from './router.js';
import { requireModels } from '#middlewares/model.middleware';

export abstract class ModuleRouter {
  public readonly router: Router;

  constructor(private mergeParams = true) {
    // useParams merged so sub-routers can see parent params
    this.router = createRouter({ mergeParams });
  }

  public build(): void {
    this.registerBindings();
    this._patchRouterMethods();
    this.defineRoutes();
  }

  /** Register any model-to-ID bindings here */
  protected abstract registerBindings(): void;

  /** Define all HTTP routes here */
  protected abstract defineRoutes(): void;

  protected bindModel<T extends ModelKey>(name: T, handler: ModelHandler<T>) {
    if (this.mergeParams) {
      registerRouteModelBinding(name, handler);
    } else {
      applyBinding(this.router, name, handler);
    }
  }

  /**
   * Patches the router's HTTP verb methods so that every route registered
   * inside {@link defineRoutes} automatically gets {@link requireModels}
   * injected just before the final handler (the controller).  This ensures
   * that all route-model bindings have been verified after auth/guards run
   * and before any controller logic executes.
   */
  private _patchRouterMethods(): void {
    type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
    type RouteFn = (path: unknown, ...handlers: RequestHandler[]) => Router;
    const patchable = this.router as Record<HttpMethod, RouteFn>;

    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const original = patchable[method].bind(this.router);

      patchable[method] = (path: unknown, ...handlers: RequestHandler[]) => {
        if (handlers.length > 0) {
          const last = handlers[handlers.length - 1];
          const rest = handlers.slice(0, -1);
          return original(path, ...rest, requireModels, last);
        }
        return original(path, ...handlers);
      };
    }
  }
}

import type { Router } from 'express';
import { createRouter, registerRouteModelBinding } from './router.js';
import type { BaseController } from '#core/base/BaseController';

export abstract class ModuleRouter {
  public readonly router: Router;

  constructor() {
    // useParams merged so sub-routers can see parent params
    this.router = createRouter({ mergeParams: true });
    this.registerBindings();
    this.defineRoutes();
  }

  /** Register any model-to-ID bindings here */
  protected abstract registerBindings(): void;

  /** Define all HTTP routes here */
  protected abstract defineRoutes(): void;

  protected controller<T extends BaseController, K extends keyof T>(
    instance: T,
    method: K,
  ) {
    // Check at runtime to ensure it's actually a function
    const fn = instance[method];
    if (typeof fn !== 'function') {
      throw new Error(`"${String(method)}" is not a function!`);
    }
    // Now the compiler allows you to bind it
    return fn.bind(instance) as T[K];
  }

  protected bindModel = registerRouteModelBinding;
}

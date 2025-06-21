import type { Router } from 'express';
import { createRouter, registerRouteModelBinding } from './router.js';

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

  protected bindModel = registerRouteModelBinding;
}

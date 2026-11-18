import type { Router } from 'express';
import {
  createRouter,
  type ModelKey,
  type ModelHandler,
  registerRouteModelBinding,
  applyBinding,
} from './router.js';
import {
  type OwnerFields,
  registerOwnership,
} from '#core/permission/ownership';

interface BindModelOptions<T extends ModelKey> {
  /** User-id fields that make a user the owner, for `:own` grants. */
  ownedBy?: OwnerFields<T>;
}

export abstract class ModuleRouter {
  public readonly router: Router;

  constructor(private mergeParams = true) {
    // useParams merged so sub-routers can see parent params
    this.router = createRouter({ mergeParams });
  }

  public build(): void {
    this.registerBindings();
    this.defineRoutes();
  }

  /** Register any model-to-ID bindings here */
  protected abstract registerBindings(): void;

  /** Define all HTTP routes here */
  protected abstract defineRoutes(): void;

  protected bindModel<T extends ModelKey>(
    name: T,
    handler: ModelHandler<T>,
    options: BindModelOptions<T> = {},
  ) {
    if (options.ownedBy) {
      registerOwnership(name, options.ownedBy);
    }

    if (this.mergeParams) {
      registerRouteModelBinding(name, handler);
    } else {
      applyBinding(this.router, name, handler);
    }
  }
}

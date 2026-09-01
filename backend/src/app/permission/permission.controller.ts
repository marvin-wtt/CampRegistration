import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { injectable } from 'inversify';
import { permissionRegistry } from '#core/permission-registry';

@injectable()
export class PermissionController extends BaseController {
  index(_req: Request, res: Response) {
    res.json({ data: permissionRegistry.toMatrix() });
  }
}

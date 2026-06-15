import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { FileController } from '#app/file/file.controller';
import { FileService } from '#app/file/file.service';
import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#app/campManager/camp-manager.guard';
import fileAccessGuard from '#app/file/file.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';
import ApiError from '#utils/ApiError';

export class CampFilesRouter extends ModuleRouter {
  constructor() {
    super(false);
  }

  protected registerBindings() {
    const fileService = resolve(FileService);

    this.bindModel('file', (req, id) => {
      const camp = req.model('camp');
      if (!camp) {
        return null;
      }
      return fileService.getModelFile('camp', camp.id, id);
    });
  }

  protected defineRoutes() {
    const fileController = resolve(FileController);

    // Resolves a form slot ({_file.<slot>}) to the matching file for the requested
    // locale and binds it as the route's file model. Access and readiness are then
    // enforced by the shared file access guard and stream controller below.
    this.router.get(
      '/slots/:slot',
      this.resolveSlotFile,
      guard(fileAccessGuard),
      controller(fileController, 'stream'),
    );

    // This route is used to redirect to the file API endpoint
    // In the future, it should serve the file model instead
    this.router.get('/:fileId', (req, res) => {
      res.redirect('/api/v1/files/' + req.params.fileId);
    });

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.files.view')),
      controller(fileController, 'index'),
    );
    this.router.post(
      '/',
      auth(),
      guard(campManager('camp.files.create')),
      multipart('file'),
      controller(fileController, 'store'),
    );
    this.router.delete(
      '/:fileId',
      auth(),
      guard(campManager('camp.files.delete')),
      controller(fileController, 'destroy'),
    );
  }

  private resolveSlotFile: RequestHandler = (req, _res, next) => {
    const fileService = resolve(FileService);

    void (async () => {
      const camp = req.modelOrFail('camp');
      const slotParam = req.params.slot;
      const slot = Array.isArray(slotParam) ? slotParam[0] : slotParam;
      const locale =
        typeof req.query.locale === 'string' ? req.query.locale : undefined;

      const file = slot
        ? await fileService.getModelFileForSlot(
            { id: camp.id, name: 'camp' },
            slot,
            locale,
          )
        : null;

      if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No file found for slot');
      }

      req.setModel('file', file);
      // Expose the resolved id as the route's file param so the downstream
      // stream controller validates and streams it like /files/:fileId.
      req.params.fileId = file.id;
    })().then(next, next);
  };
}

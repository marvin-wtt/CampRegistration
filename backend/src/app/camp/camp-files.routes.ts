import httpStatus from 'http-status';
import { FileController } from '#app/file/file.controller';
import { FileService } from '#app/file/file.service';
import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#app/campManager/camp-manager.guard';
import fileAccessGuard from '#app/file/file.guard';
import { controller } from '#utils/bindController';
import { catchMiddlewareAsync } from '#utils/catchAsync';
import validator from '#app/file/file.validation';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';
import ApiError from '#utils/ApiError';

export class CampFilesRouter extends ModuleRouter {
  private readonly fileService = resolve(FileService);

  constructor() {
    super(false);
  }

  protected registerBindings() {
    this.bindModel('file', (req, id) => {
      const camp = req.model('camp');
      if (!camp) {
        return null;
      }
      return this.fileService.getModelFile('camp', camp.id, id);
    });
  }

  protected defineRoutes() {
    const fileController: FileController = resolve(FileController);

    // Resolves a form slot ({_file.<slot>}) to the matching file for the requested
    // locale and binds it as the route's file model. Access and readiness are then
    // enforced by the shared file access guard and stream controller below.
    this.router.get(
      '/slots/:slot',
      this.resolveSlotFile,
      guard(fileAccessGuard('view')),
      controller(fileController, 'stream'),
    );

    // These routes are used to redirect to the file API endpoint
    // In the future, it should serve the file model instead.
    // Use 307/308 so non-GET methods (e.g. DELETE) are preserved across the
    // redirect instead of being downgraded to GET by the client.
    this.router.get('/:fileId', (req, res) => {
      res.redirect('/api/v1/files/' + req.params.fileId);
    });
    this.router.delete('/:fileId', (req, res) => {
      res.redirect(307, '/api/v1/files/' + req.params.fileId);
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
  }

  private resolveSlotFile = catchMiddlewareAsync(async (req) => {
    const camp = req.modelOrFail('camp');
    const {
      params: { slot },
      query: { locale },
    } = await req.validate(validator.slotFile);

    const file = await this.fileService.getModelFileForSlot(
      { id: camp.id, name: 'camp' },
      slot,
      locale,
    );

    if (!file) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No file found for slot');
    }

    req.setModel('file', file);
    // Expose the resolved id as the route's file param so the shared stream
    // controller validates and streams it like /files/:fileId.
    req.params.fileId = file.id;
  });
}

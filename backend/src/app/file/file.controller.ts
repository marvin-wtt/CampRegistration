import { pipeline } from 'stream/promises';
import { FileService } from './file.service.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import logger from '#core/logger';
import type { Request, Response } from 'express';
import { FileResource } from './file.resource.js';
import validator from './file.validation.js';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';
import contentDisposition from 'content-disposition';

interface ModelData {
  id: string;
  name: string;
}

// pipeline reports a client that disconnected mid-download as a premature
// close of the destination; that is routine, not a server error.
const isClientDisconnect = (error: unknown): boolean =>
  error instanceof Error &&
  'code' in error &&
  error.code === 'ERR_STREAM_PREMATURE_CLOSE';

@injectable()
export class FileController extends BaseController {
  constructor(
    @inject(FileService) private readonly fileService: FileService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async stream(req: Request, res: Response) {
    const {
      query: { download },
    } = await req.validate(validator.stream);

    const file = req.modelOrFail('file');

    if (file.uploadStatus === 'PENDING') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'File upload is still in progress',
      );
    }

    const contentDispositionHeader = this.buildContentDisposition(
      file.originalName,
      download,
    );

    const fileStream = await this.fileService.getFileStream(file);

    // Set response headers for image display
    res.contentType(file.type);

    res.setHeader('Content-disposition', contentDispositionHeader);

    // pipeline (unlike pipe) propagates stream errors and tears the whole
    // chain down when either side fails or the client disconnects.
    try {
      await pipeline(fileStream, res);
    } catch (error) {
      if (isClientDisconnect(error)) {
        return;
      }

      if (!res.headersSent) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Failed to read file',
        );
      }

      // Mid-stream failure: the status is already out, so destroying the
      // socket is the only way to signal a truncated response.
      logger.error(`Failed to stream file "${file.id}"`, error);
      res.destroy();
    }
  }

  show(req: Request, res: Response) {
    const file = req.modelOrFail('file');

    res.resource(new FileResource(file));
  }

  async index(req: Request, res: Response) {
    const {
      query: { page, name, type },
    } = await req.validate(validator.index);

    const model = this.getRelationModel(req);
    if (!model) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No relation model found');
    }

    const data = await this.fileService.queryModelFiles(
      model,
      {
        name,
        type,
      },
      {
        limit: 20,
        page,
        sortBy: 'id',
        sortType: 'asc',
      },
    );

    res.resource(FileResource.collection(data));
  }

  async store(req: Request, res: Response) {
    const {
      body: { accessLevel, field, locale, name },
      file,
    } = await req.validate(validator.store);

    const model = this.getRelationModel(req);

    // Use the session id as the default field value if no field is provided
    // This helps to avoid that other people can hijack anonymous files
    const fieldValue = field ?? req.sessionId;

    const data = await this.fileService.saveModelFile(
      model,
      file,
      name,
      fieldValue,
      locale,
      accessLevel ?? 'private',
    );

    // Files are polymorphic; only camp-owned files are a realtime resource.
    if (model?.name === 'camp') {
      void this.realtimeService.emit(model.id, 'file', data.id, 'created');
    }

    res.status(httpStatus.CREATED).resource(new FileResource(data));
  }

  async update(req: Request, res: Response) {
    const {
      body: { accessLevel, field, locale, name },
    } = await req.validate(validator.update);
    const file = req.modelOrFail('file');

    const updatedFile = await this.fileService.updateFile(file.id, {
      accessLevel,
      field,
      locale,
      name,
    });

    if (updatedFile.campId) {
      void this.realtimeService.emit(
        updatedFile.campId,
        'file',
        updatedFile.id,
        'updated',
      );
    }

    res.resource(new FileResource(updatedFile));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const file = req.modelOrFail('file');

    await this.fileService.deleteFile(file.id);

    if (file.campId) {
      void this.realtimeService.emit(file.campId, 'file', file.id, 'deleted');
    }

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  private buildContentDisposition(
    originalName: string,
    download: boolean | undefined,
  ): string {
    const type = download ? 'attachment' : 'inline';
    try {
      return contentDisposition.create(originalName, { type });
    } catch {
      // originalName contains characters rejected by RFC 6266 (e.g. CR/LF);
      return contentDisposition.create(undefined, { type });
    }
  }

  getRelationModel(req: Request): ModelData | undefined {
    const registration = req.model('registration');
    if (registration) {
      return {
        id: registration.id,
        name: 'registration',
      };
    }
    const camp = req.model('camp');
    if (camp) {
      return {
        id: camp.id,
        name: 'camp',
      };
    }

    return undefined;
  }
}

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
import { isClientDisconnect } from '#utils/stream';

// Types a browser shows without running anything. Everything else downloads:
// an XML upload (an SVG or XHTML with an `<?xml` prolog) would otherwise render,
// scripts included, on the API's origin.
const INLINE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'application/pdf',
]);

interface ModelData {
  id: string;
  name: string;
}

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

    // A file still being moved into storage is served from the tmp dir.
    const fileStream = await this.fileService.getFileStream(file);

    // Set response headers for image display
    res.contentType(file.type);

    // Inline only when nothing asks for a download and the type is safe to
    // show; every other case downloads, so a request can't opt a script in.
    const inline = !download && INLINE_MIME_TYPES.has(file.type);
    res.setHeader(
      'Content-disposition',
      this.buildContentDisposition(
        file.originalName,
        inline ? 'inline' : 'attachment',
      ),
    );

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
        // Unpaged by default: the editor derives slot state (logo, banner,
        // free versions) from the whole list, not the first page of it.
        limit: page ? 20 : undefined,
        page,
        sortBy: 'id',
        sortType: 'asc',
      },
    );

    res.resource(FileResource.collection(data));
  }

  async store(req: Request, res: Response) {
    const model = this.getRelationModel(req);
    const {
      body: { accessLevel, group, field, locale, name },
      file,
    } = await req.validate(
      validator.store(this.groupsOf(req, model?.name === 'event')),
    );

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
      group,
    );

    // Files are polymorphic; only event-owned files are a realtime resource.
    if (model?.name === 'event') {
      void this.realtimeService.emit(model.id, 'file', data.id, 'created');
    }

    res.status(httpStatus.CREATED).resource(new FileResource(data));
  }

  async update(req: Request, res: Response) {
    const file = req.modelOrFail('file');
    const {
      body: { accessLevel, group, field, locale, name },
    } = await req.validate(
      validator.update(this.groupsOf(req, file.eventId !== null), file),
    );

    const updatedFile = await this.fileService.updateFile(file.id, {
      accessLevel,
      group,
      field,
      locale,
      name,
    });

    if (updatedFile.eventId) {
      void this.realtimeService.emit(
        updatedFile.eventId,
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

    if (file.eventId) {
      void this.realtimeService.emit(file.eventId, 'file', file.id, 'deleted');
    }

    res.sendStatus(httpStatus.NO_CONTENT);
  }

  private buildContentDisposition(
    originalName: string,
    type: 'inline' | 'attachment',
  ): string {
    try {
      return contentDisposition.create(originalName, { type });
    } catch {
      // originalName contains characters rejected by RFC 6266 (e.g. CR/LF);
      return contentDisposition.create(undefined, { type });
    }
  }

  // Only an event's files can be per group. Its model is bound by the event
  // files router on upload and by the event file guard on update.
  private groupsOf(req: Request, eventOwned: boolean): readonly string[] {
    return eventOwned ? req.modelOrFail('event').countries : [];
  }

  getRelationModel(req: Request): ModelData | undefined {
    const registration = req.model('registration');
    if (registration) {
      return {
        id: registration.id,
        name: 'registration',
      };
    }
    const event = req.model('event');
    if (event) {
      return {
        id: event.id,
        name: 'event',
      };
    }

    return undefined;
  }
}

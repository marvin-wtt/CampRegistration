import { FileService } from './file.service.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import type { Request, Response } from 'express';
import { FileResource } from './file.resource.js';
import { sendFile } from './file.response.js';
import validator from './file.validation.js';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';

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

    await sendFile(res, this.fileService, req.modelOrFail('file'), download);
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

    // Files are polymorphic; only event-owned files are a realtime resource.
    if (model?.name === 'event') {
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

import { FileService } from './file.service.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import type { Request, Response } from 'express';
import { FileResource } from './file.resource.js';
import validator from './file.validation.js';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';

interface ModelData {
  id: string;
  name: string;
}

@injectable()
export class FileController extends BaseController {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

  async stream(req: Request, res: Response) {
    const {
      query: { download },
    } = await req.validate(validator.stream);

    const file = req.modelOrFail('file');
    const fileStream = this.fileService.getFileStream(file);

    // Set response headers for image display
    res.contentType(file.type);

    const disposition = download ? 'attachment' : 'inline';
    res.setHeader(
      'Content-disposition',
      `${disposition}; filename=${file.originalName}`,
    );

    fileStream.pipe(res); // Pipe the file stream to the response
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
      body: { accessLevel, field, name },
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
      accessLevel ?? 'private',
    );

    res.status(httpStatus.CREATED).resource(new FileResource(data));
  }

  async destroy(req: Request, res: Response) {
    const file = req.modelOrFail('file');

    await this.fileService.deleteFile(file.id);

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

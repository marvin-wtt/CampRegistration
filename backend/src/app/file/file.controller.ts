import { FileService } from './file.service.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import type { Request, Response } from 'express';
import { FileResource } from './file.resource.js';
import validator from './file.validation.js';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';
import contentDisposition from 'content-disposition';

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

    if (file.uploadStatus === 'PENDING') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'File upload is still in progress',
      );
    }

    const fileStream = this.fileService.getFileStream(file);

    // Set response headers for image display
    res.contentType(file.type);

    res.setHeader(
      'Content-disposition',
      this.buildContentDisposition(file.originalName, download),
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

  private buildContentDisposition(
    originalName: string,
    download: boolean | undefined,
  ): string {
    const type = download ? 'attachment' : 'inline';
    try {
      return contentDisposition(originalName, { type });
    } catch {
      // originalName contains characters rejected by RFC 6266 (e.g. CR/LF);
      return contentDisposition(undefined, { type });
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

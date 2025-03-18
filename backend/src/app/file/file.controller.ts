import fileService from './file.service.js';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import type { Request, Response } from 'express';
import { FileResource } from './file.resource.js';
import validator from './file.validation.js';

const stream = async (req: Request, res: Response) => {
  const {
    query: { download },
  } = await req.validate(validator.stream);

  const file = req.modelOrFail('file');
  const fileStream = await fileService.getFileStream(file);

  // Set response headers for image display
  res.contentType(file.type);

  const disposition = download ? 'attachment' : 'inline';
  res.setHeader(
    'Content-disposition',
    `${disposition}; filename=${file.originalName}`,
  );

  fileStream.pipe(res); // Pipe the file stream to the response
};

const show = (req: Request, res: Response) => {
  const file = req.modelOrFail('file');

  res.resource(new FileResource(file));
};

const index = async (req: Request, res: Response) => {
  const {
    query: { page, name, type },
  } = await req.validate(validator.index);

  const model = getRelationModel(req);
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No relation model found');
  }

  const data = await fileService.queryModelFiles(
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
};

const store = async (req: Request, res: Response) => {
  const {
    body: { accessLevel, field, name },
  } = await req.validate(validator.store);
  const file = req.file;

  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No files provided.');
  }

  const model = getRelationModel(req);
  const data = await fileService.saveModelFile(
    model,
    file,
    name,
    field,
    accessLevel ?? 'private',
  );

  res.status(httpStatus.CREATED).resource(new FileResource(data));
};

const destroy = async (req: Request, res: Response) => {
  const file = req.modelOrFail('file');

  await fileService.deleteFile(file.id);

  res.sendStatus(httpStatus.NO_CONTENT);
};

interface ModelData {
  id: string;
  name: string;
}

const getRelationModel = (req: Request): ModelData | undefined => {
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
};

export default {
  stream,
  show,
  index,
  store,
  destroy,
};

import { catchRequestAsync } from 'utils/catchAsync';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import fileService from './file.service';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { collection, resource } from 'core/resource';
import { Request } from 'express';
import fileResource from './file.resource';
import { File } from '@prisma/client';
import validator from './file.validation';
import { validateRequest } from 'core/validation/request';

const stream = catchRequestAsync(async (req, res) => {
  const {
    query: { download },
  } = await validateRequest(req, validator.stream);

  const file = routeModel(req.models.file);
  const fileStream = await fileService.getFileStream(file);

  // Set response headers for image display
  res.contentType(file.type);

  const disposition = download ? 'attachment' : 'inline';
  res.setHeader(
    'Content-disposition',
    `${disposition}; filename=${file.originalName}`,
  );

  fileStream.pipe(res); // Pipe the file stream to the response
});

const show = catchRequestAsync(async (req, res) => {
  const file = routeModel(req.models.file);

  res.status(httpStatus.OK).json(fileResource(file));
});

const index = catchRequestAsync(async (req, res) => {
  const {
    query: { page, name, type },
  } = await validateRequest(req, validator.index);

  const model = verifyModelExists(getRelationModel(req));

  const data = (await fileService.queryModelFiles(
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
  )) as File[];

  const response = collection(data.map((value) => fileResource(value)));
  res.status(httpStatus.OK).json(response);
});

const store = catchRequestAsync(async (req, res) => {
  const {
    body: { accessLevel, field, name },
  } = await validateRequest(req, validator.store);
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

  const response = resource(fileResource(data));
  res.status(httpStatus.CREATED).json(response);
});

const destroy = catchRequestAsync(async (req, res) => {
  const file = routeModel(req.models.file);

  await fileService.deleteFile(file.id);

  res.sendStatus(httpStatus.NO_CONTENT);
});

interface ModelData {
  id: string;
  name: string;
}

const getRelationModel = (req: Request): ModelData | undefined => {
  if (req.models.registration) {
    return {
      id: req.models.registration.id,
      name: 'registration',
    };
  }
  if (req.models.camp) {
    return {
      id: req.models.camp.id,
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

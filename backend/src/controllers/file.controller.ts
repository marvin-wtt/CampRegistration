import { catchRequestAsync } from "@/utils/catchAsync";
import { routeModel } from "@/utils/verifyModel";
import { fileService } from "@/services";
import httpStatus from "http-status";
import ApiError from "@/utils/ApiError";
import { collection, resource } from "@/resources/resource";
import { Request } from "express";
import { fileResource } from "@/resources";
import { File } from "@prisma/client";

const show = catchRequestAsync(async (req, res) => {
  const { download } = req.query;
  const file = routeModel(req.models.file);
  const fileStream = await fileService.getFileStream(file);

  // Set response headers for image display
  res.contentType(file.type);

  const disposition = download ? "attachment" : "inline";
  res.setHeader(
    "Content-disposition",
    `${disposition}; filename=${file.originalName}`,
  );

  fileStream.pipe(res); // Pipe the file stream to the response
});

const index = catchRequestAsync(async (req, res) => {
  const model = getRelationModel(req);

  const page = req.query.page ? Number(req.query.page) : undefined;
  const name = req.query.name as string | undefined;
  const type = req.query.type as string | undefined;

  const data = (await fileService.queryModelFiles(
    model.name,
    model.id,
    {
      name,
      type,
    },
    {
      limit: 20,
      page,
      sortBy: "id",
      sortType: "asc",
    },
  )) as File[];

  const response = collection(data.map((value) => fileResource(value)));
  res.status(httpStatus.OK).json(response);
});

const store = catchRequestAsync(async (req, res) => {
  const { accessLevel, field, name } = req.body;
  const file = req.file;

  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No files provided.");
  }

  const model = getRelationModel(req);
  const data = await fileService.saveModelFile(
    model.name,
    model.id,
    file,
    name,
    field,
    accessLevel,
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

const getRelationModel = (req: Request): ModelData => {
  // TODO Workaround until polymorphic relationships are supported
  const model: Partial<ModelData> = {};
  if (req.models.registration) {
    model.name = "registration";
    model.id = req.models.registration.id;
  } else if (req.models.camp) {
    model.name = "camp";
    model.id = req.models.camp.id;
  }

  if (!model.name || !model.id) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "File not associated to any model.",
    );
  }

  return model as ModelData;
};

export default {
  show,
  index,
  store,
  destroy,
};

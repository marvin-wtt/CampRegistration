import { campService } from "../services";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { campResource, detailedCampResource } from "../resources";
import catchAsync from "../utils/catchAsync";
import pick from "../utils/pick";
import { type Prisma } from "@prisma/client";
import exclude from "../utils/exclude";
import { collection, resource } from "../resources/resource";
import authUserId from "../utils/authUserId";

const show = catchAsync(async (req, res) => {
  const camp = req.models.camp;

  if (camp == null) {
    throw new ApiError(httpStatus.NOT_FOUND, "Camp does not exist");
  }

  res.json(resource(detailedCampResource(camp)));
});

const index = catchAsync(async (req, res) => {
  const filter = exclude(req.query, ["sortBy", "limit", "page"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const camps = await campService.queryPublicCamps(filter, options);
  const resources = camps.map((value) => campResource(value));

  res.json(collection(resources));
});

const store = catchAsync(async (req, res) => {
  const data = req.body as Prisma.CampCreateInput;
  const userId = authUserId(req);
  const camp = await campService.createCamp(userId, data);
  res.status(httpStatus.CREATED).json(resource(campResource(camp)));
});

const update = catchAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body as Prisma.CampUpdateInput;
  const camp = await campService.updateCampById(campId, data);
  if (camp == null) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Update without response."
    );
  }
  res.json(resource(campResource(camp)));
});

const destroy = catchAsync(async (req, res) => {
  const { campId } = req.params;
  await campService.deleteCampById(campId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};

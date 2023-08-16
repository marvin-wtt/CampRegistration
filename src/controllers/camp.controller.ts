import { campService } from "@/services";
import httpStatus from "http-status";
import { campResource, detailedCampResource } from "@/resources";
import { catchRequestAsync } from "@/utils/catchAsync";
import pick from "@/utils/pick";
import exclude from "@/utils/exclude";
import { collection, resource } from "@/resources/resource";
import authUserId from "@/utils/authUserId";
import { routeModel } from "@/utils/verifyModel";

const show = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);

  res.json(resource(detailedCampResource(camp)));
});

const index = catchRequestAsync(async (req, res) => {
  const filter = exclude(req.query, ["sortBy", "limit", "page"]);
  // Set user id if private camps should be included filter for camp manager
  filter.userId = filter.private ? authUserId(req) : undefined;
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const camps = await campService.queryPublicCamps(filter, options);

  const resources = camps.map((value) => campResource(value));
  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const data = req.body;
  const userId = authUserId(req);
  const camp = await campService.createCamp(userId, {
    countries: data.countries,
    name: data.name,
    public: data.public,
    maxParticipants: data.max_participants,
    startAt: data.start_at,
    endAt: data.end_at,
    minAge: data.min_age,
    maxAge: data.max_age,
    location: data.location,
    form: data.form,
  });

  res.status(httpStatus.CREATED).json(resource(detailedCampResource(camp)));
});

const update = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;
  const camp = await campService.updateCampById(campId, {
    countries: data.countries,
    name: data.name,
    public: data.public,
    maxParticipants: data.max_participants,
    startAt: data.start_at,
    endAt: data.end_at,
    minAge: data.min_age,
    maxAge: data.max_age,
    location: data.location,
    form: data.form,
  });

  res.json(resource(detailedCampResource(camp)));
});

const destroy = catchRequestAsync(async (req, res) => {
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

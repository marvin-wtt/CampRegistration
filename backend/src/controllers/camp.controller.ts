import { campService } from 'services';
import httpStatus from 'http-status';
import { campResource, detailedCampResource } from 'resources';
import { catchRequestAsync } from 'utils/catchAsync';
import pick from 'utils/pick';
import exclude from 'utils/exclude';
import { collection, resource } from 'resources/resource';
import { authUserId } from 'utils/authUserId';
import { routeModel } from 'utils/verifyModel';
import { Camp } from '@prisma/client';

const show = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);

  res.json(resource(detailedCampResource(await withFreePlaces(camp))));
});

const index = catchRequestAsync(async (req, res) => {
  const filter = exclude(req.query, ['sortBy', 'limit', 'page']);
  // Set user id if private or inactive camps should be included filter for camp manager
  filter.userId =
    filter.public == 'false' || filter.active === 'false'
      ? authUserId(req)
      : undefined;

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  // TODO Add default options, make sure validation is correct and add pagination meta
  const camps = await campService.queryPublicCamps(filter, options);

  const resources = await Promise.all(
    camps.map(async (value) => campResource(await withFreePlaces(value))),
  );
  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const data = req.body;
  const userId = authUserId(req);

  // TODO Set default form
  const form = data.form ?? {};
  // TODO Set themes
  const themes = data.themes ?? {};

  const camp = await campService.createCamp(userId, {
    countries: data.countries,
    name: data.name,
    organizer: data.organizer,
    contactEmail: data.contactEmail,
    active: data.active ?? false,
    public: data.public,
    maxParticipants: data.maxParticipants,
    startAt: data.startAt,
    endAt: data.endAt,
    minAge: data.minAge,
    maxAge: data.maxAge,
    price: data.price,
    location: data.location,
    form: form,
    themes: themes,
  });

  // TODO Add default templates

  res
    .status(httpStatus.CREATED)
    .json(resource(detailedCampResource(await withFreePlaces(camp))));
});

const update = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;
  const camp = await campService.updateCampById(campId, {
    countries: data.countries,
    name: data.name,
    organizer: data.organizer,
    contactEmail: data.contactEmail,
    active: data.active,
    public: data.public,
    maxParticipants: data.maxParticipants,
    startAt: data.startAt,
    endAt: data.endAt,
    minAge: data.minAge,
    maxAge: data.maxAge,
    price: data.price,
    location: data.location,
    form: data.form,
    themes: data.themes,
  });

  res.json(resource(detailedCampResource(camp)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  await campService.deleteCampById(campId);

  res.status(httpStatus.NO_CONTENT).send();
});

const withFreePlaces = async (camp: Camp) => {
  const freePlaces = await campService.getCampFreePlaces(camp);

  return {
    ...camp,
    freePlaces,
  };
};

export default {
  index,
  show,
  store,
  update,
  destroy,
};

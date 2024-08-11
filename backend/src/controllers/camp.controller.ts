import { campService, registrationService } from 'services';
import httpStatus from 'http-status';
import { campResource, detailedCampResource } from 'resources';
import { catchRequestAsync } from 'utils/catchAsync';
import { collection, resource } from 'resources/resource';
import { authUserId } from 'utils/authUserId';
import { routeModel } from 'utils/verifyModel';
import { Camp } from '@prisma/client';
import defaultForm from 'assets/camp/defaultForm.json';
import defaultThemes from 'assets/camp/defaultThemes.json';
import type { CampQuery } from '@camp-registration/common/entities';

const show = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);

  res.json(resource(detailedCampResource(await withFreePlaces(camp))));
});

const index = catchRequestAsync(async (req, res) => {
  const query = req.query as CampQuery;
  const camps = await campService.queryCamps(
    {
      public: query.showAll ? undefined : true,
      active: query.showAll ? undefined : true,
      name: query.name,
      country: query.country,
      age: query.age,
      startAt: query.startAt,
      entAt: query.endAt,
    },
    {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortType: query.sortType,
    },
  );

  const resources = await Promise.all(
    camps.map(async (value) => campResource(await withFreePlaces(value))),
  );

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const data = req.body;
  const userId = authUserId(req);

  const form = data.form ?? defaultForm;
  const themes = data.themes ?? defaultThemes;

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

  // Re-generate camp data fields
  if (data.form) {
    await registrationService.updateRegistrationCampDataByCamp(camp);
  }

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

import {
  campService,
  fileService,
  registrationService,
  tableTemplateService,
} from 'services';
import httpStatus from 'http-status';
import { campResource, detailedCampResource } from 'resources';
import { catchRequestAsync } from 'utils/catchAsync';
import { collection, resource } from 'resources/resource';
import { authUserId } from 'utils/authUserId';
import { routeModel } from 'utils/verifyModel';
import defaultForm from 'assets/camp/defaultForm.json';
import defaultThemes from 'assets/camp/defaultThemes.json';
import defaultTemplates from 'assets/camp/defaultTemplates.json';
import type {
  CampQuery,
  CampCreateData,
  CampUpdateData,
} from '@camp-registration/common/entities';

const show = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);

  res.json(resource(detailedCampResource(camp)));
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
    camps.map(async (value) => campResource(value)),
  );

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const data = req.body as CampCreateData;
  const userId = authUserId(req);

  const referenceCamp = data.referenceCampId
    ? await campService.getCampById(data.referenceCampId)
    : undefined;

  const form = data.form ?? referenceCamp?.form ?? defaultForm;
  const themes = data.themes ?? referenceCamp?.themes ?? defaultThemes;

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

  // Insert templates
  const templates = data.referenceCampId
    ? (await tableTemplateService.queryTemplates(data.referenceCampId)).map(
        (value) => value.data,
      )
    : defaultTemplates;
  await tableTemplateService.createManyTemplates(camp.id, templates);

  // TODO Copy files and update form

  res.status(httpStatus.CREATED).json(resource(detailedCampResource(camp)));
});

const update = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const data = req.body as CampUpdateData;

  const updatedCamp = await campService.updateCamp(camp, {
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
    await registrationService.updateRegistrationCampDataByCamp(updatedCamp);
  }

  res.json(resource(detailedCampResource(updatedCamp)));
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

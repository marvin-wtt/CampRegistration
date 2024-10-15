import campService from './camp.service';
import { campResource, detailedCampResource } from './camp.resource';
import fileService from 'app/file/file.service';
import registrationService from 'app/registration/registration.service';
import tableTemplateService from 'app/tableTemplate/table-template.service';
import httpStatus from 'http-status';
import { collection, resource } from 'app/resource';
import { authUserId } from 'utils/authUserId';
import { routeModel } from 'utils/verifyModel';
import defaultForm from 'assets/camp/defaultForm';
import defaultThemes from 'assets/camp/defaultThemes';
import defaultTemplates from 'assets/camp/defaultTemplates';
import defaultFiles from 'assets/camp/defaultFiles';
import type {
  CampQuery,
  CampCreateData,
  CampUpdateData,
} from '@camp-registration/common/entities';
import { Request, Response } from 'express';

const show = async (req: Request, res: Response) => {
  const camp = routeModel(req.models.camp);

  res.json(resource(detailedCampResource(camp)));
};

const index = async (req: Request, res: Response) => {
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

  const resources = camps.map((value) => campResource(value));

  res.json(collection(resources));
};

const store = async (req: Request, res: Response) => {
  const data = req.body as CampCreateData;
  const userId = authUserId(req);

  const referenceCamp = data.referenceCampId
    ? await campService.getCampById(data.referenceCampId)
    : undefined;

  const form = data.form ?? referenceCamp?.form ?? defaultForm;
  const themes = data.themes ?? referenceCamp?.themes ?? defaultThemes;

  // Copy files from reference or use defaults
  const files = data.referenceCampId
    ? await fileService.queryModelFiles({
        name: 'camp',
        id: data.referenceCampId,
      })
    : defaultFiles;

  // Copy table templates from reference or use defaults
  const templates = data.referenceCampId
    ? await tableTemplateService.queryTemplates(data.referenceCampId)
    : defaultTemplates.map((value) => ({ data: value }));

  const camp = await campService.createCamp(
    userId,
    {
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
    },
    templates,
    files,
  );

  res.status(httpStatus.CREATED).json(resource(detailedCampResource(camp)));
};

const update = async (req: Request, res: Response) => {
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
};

const destroy = async (req: Request, res: Response) => {
  const { campId } = req.params;
  await campService.deleteCampById(campId);

  res.status(httpStatus.NO_CONTENT).send();
};

export default {
  index,
  show,
  store,
  update,
  destroy,
};

import campService from './camp.service.js';
import { campResource, detailedCampResource } from './camp.resource.js';
import fileService from '#app/file/file.service';
import registrationService from '#app/registration/registration.service';
import tableTemplateService from '#app/tableTemplate/table-template.service';
import httpStatus from 'http-status';
import { collection, resource } from '#core/resource';
import { authUserId } from '#utils/authUserId';
import { routeModel } from '#utils/verifyModel';
import defaultForm from '#assets/camp/defaultForm';
import defaultThemes from '#assets/camp/defaultThemes';
import defaultTemplates from '#assets/camp/defaultTemplates';
import defaultFiles from '#assets/camp/defaultFiles';
import validator from './camp.validation.js';
import type { Request, Response } from 'express';

const show = async (req: Request, res: Response) => {
  const camp = routeModel(req.models.camp);

  res.json(resource(detailedCampResource(camp)));
};

const index = async (req: Request, res: Response) => {
  const { query } = await req.validate(validator.index);

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
  const { body } = await req.validate(validator.store);
  const userId = authUserId(req);

  const referenceCamp = body.referenceCampId
    ? await campService.getCampById(body.referenceCampId)
    : undefined;

  const form = body.form ?? referenceCamp?.form ?? defaultForm;
  const themes = body.themes ?? referenceCamp?.themes ?? defaultThemes;

  // Copy files from reference or use defaults
  const files = body.referenceCampId
    ? await fileService.queryModelFiles({
        name: 'camp',
        id: body.referenceCampId,
      })
    : defaultFiles;

  // Copy table templates from reference or use defaults
  const templates = body.referenceCampId
    ? await tableTemplateService.queryTemplates(body.referenceCampId)
    : defaultTemplates.map((value) => ({ data: value }));

  const camp = await campService.createCamp(
    userId,
    {
      countries: body.countries,
      name: body.name,
      organizer: body.organizer,
      contactEmail: body.contactEmail,
      active: body.active ?? false,
      public: body.public,
      maxParticipants: body.maxParticipants,
      startAt: body.startAt,
      endAt: body.endAt,
      minAge: body.minAge,
      maxAge: body.maxAge,
      price: body.price,
      location: body.location,
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
  const { body } = await req.validate(validator.update(camp));

  const updatedCamp = await campService.updateCamp(camp, {
    countries: body.countries,
    name: body.name,
    organizer: body.organizer,
    contactEmail: body.contactEmail,
    active: body.active,
    public: body.public,
    maxParticipants: body.maxParticipants,
    startAt: body.startAt,
    endAt: body.endAt,
    minAge: body.minAge,
    maxAge: body.maxAge,
    price: body.price,
    location: body.location,
    form: body.form,
    themes: body.themes,
  });

  // Re-generate camp data fields
  if (body.form) {
    await registrationService.updateRegistrationCampDataByCamp(updatedCamp);
  }

  res.json(resource(detailedCampResource(updatedCamp)));
};

const destroy = async (req: Request, res: Response) => {
  const { params } = await req.validate(validator.destroy);

  await campService.deleteCampById(params.campId);

  res.status(httpStatus.NO_CONTENT).send();
};

export default {
  index,
  show,
  store,
  update,
  destroy,
};

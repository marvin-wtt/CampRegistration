import campService from './camp.service.js';
import { CampResource, CampDetailsResource } from './camp.resource.js';
import fileService from '#app/file/file.service';
import registrationService from '#app/registration/registration.service';
import tableTemplateService from '#app/tableTemplate/table-template.service';
import httpStatus from 'http-status';
import defaultForm from '#assets/camp/form';
import defaultThemes from '#assets/camp/themes';
import defaultTableTemplates from '#assets/camp/tableTemplates';
import defaultMessageTemplates from '#assets/camp/messageTemplates';
import defaultFiles from '#assets/camp/files';
import validator from './camp.validation.js';
import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import messageTemplateService from '#app/messageTemplate/message-template.service';
import managerService from '#app/manager/manager.service.js';
import ApiError from '#utils/ApiError.js';

class CampController extends BaseController {
  show(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');

    res.resource(new CampDetailsResource(camp));
  }

  async index(req: Request, res: Response) {
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

    res.resource(CampResource.collection(camps));
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const userId = req.authUserId();

    // Check if the user is allowed to create a camp based on the reference camp
    // This must happen here because the body needs to be validated first
    if (body.referenceCampId) {
      const isManager =
        await managerService.campManagerExistsWithUserIdAndCampId(
          body.referenceCampId,
          userId,
        );

      if (!isManager) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'You are not allowed to create a camp based on this reference camp.',
        );
      }
    }

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
    const tableTemplates = body.referenceCampId
      ? await tableTemplateService.queryTemplates(body.referenceCampId)
      : defaultTableTemplates.map((value) => ({ data: value }));

    const messageTemplates = body.referenceCampId
      ? await messageTemplateService.queryMessageTemplates(body.referenceCampId)
      : defaultMessageTemplates;

    const camp = await campService.createCamp(
      userId,
      {
        countries: body.countries,
        name: body.name,
        organizer: body.organizer,
        contactEmail: body.contactEmail,
        active: body.active ?? false,
        public: body.public ?? false,
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
      tableTemplates,
      messageTemplates,
      files,
    );

    res.status(httpStatus.CREATED).resource(new CampDetailsResource(camp));
  }

  async update(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
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

    // Re-generate computed data fields
    if (body.form) {
      await registrationService.updateRegistrationsComputedDataByCamp(
        updatedCamp,
      );
    }

    res.resource(new CampDetailsResource(updatedCamp));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.destroy);

    await campService.deleteCampById(campId);

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export default new CampController();

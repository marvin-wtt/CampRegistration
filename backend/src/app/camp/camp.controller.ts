import { CampService } from './camp.service.js';
import { CampResource, CampDetailsResource } from './camp.resource.js';
import { FileService } from '#app/file/file.service';
import { RegistrationService } from '#app/registration/registration.service';
import { TableTemplateService } from '#app/tableTemplate/table-template.service';
import httpStatus from 'http-status';
import {
  defaultMessageTemplatesForCountries,
  getCampPreset,
} from '#app/camp/presets/index.js';
import validator from './camp.validation.js';
import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import { CampManagerService } from '#app/campManager/camp-manager.service.js';
import { RealtimeService } from '#core/realtime/RealtimeService';
import ApiError from '#utils/ApiError';
import { inject, injectable } from 'inversify';

@injectable()
export class CampController extends BaseController {
  constructor(
    @inject(CampService) private readonly campService: CampService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(CampManagerService)
    private readonly managerService: CampManagerService,
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(TableTemplateService)
    private readonly tableTemplateService: TableTemplateService,
    @inject(MessageTemplateService)
    private readonly messageTemplateService: MessageTemplateService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  show(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');

    res.resource(new CampDetailsResource(camp));
  }

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);

    const showPrivate = query.view === 'all' || query.view === 'assigned';

    const camps = await this.campService.queryCamps(
      {
        managerUserId: query.view === 'assigned' ? req.authUserId() : undefined,
        public: showPrivate ? undefined : true,
        name: query.name,
        country: query.country,
        age: query.age,
        startAt: query.startAt,
        endAt: query.endAt,
      },
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy ?? 'startAt',
        sortType: query.sortType ?? 'asc',
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
        await this.managerService.campManagerExistsWithUserIdAndCampId(
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
      ? await this.campService.getCampById(body.referenceCampId)
      : undefined;

    const preset = getCampPreset(body.preset);

    const form = body.form ?? referenceCamp?.form ?? preset.form;
    const themes = body.themes ?? referenceCamp?.themes ?? preset.themes;

    // Copy files from reference camp when cloning; no default files otherwise
    const files = body.referenceCampId
      ? await this.fileService.queryModelFiles({
          name: 'camp',
          id: body.referenceCampId,
        })
      : [];

    // Copy table templates from reference camp when cloning; otherwise use preset
    const tableTemplates = body.referenceCampId
      ? await this.tableTemplateService.queryTemplates(body.referenceCampId)
      : preset.tableTemplates.map((value) => ({ data: value }));

    const messageTemplates = body.referenceCampId
      ? await this.messageTemplateService.queryMessageTemplates(
          body.referenceCampId,
        )
      : defaultMessageTemplatesForCountries(body.countries);

    const camp = await this.campService.createCamp(
      userId,
      {
        countries: body.countries,
        name: body.name,
        organizer: body.organizer,
        contactEmail: body.contactEmail,
        public: body.public ?? false,
        registrationOpensAt: body.registrationOpensAt ?? null,
        registrationClosesAt: body.registrationClosesAt ?? null,
        maxParticipants: body.maxParticipants,
        confirmationMode: body.confirmationMode ?? 'AUTOMATIC',
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

    const updatedCamp = await this.campService.updateCamp(camp, {
      countries: body.countries,
      name: body.name,
      organizer: body.organizer,
      contactEmail: body.contactEmail,
      public: body.public,
      registrationOpensAt: body.registrationOpensAt,
      registrationClosesAt: body.registrationClosesAt,
      maxParticipants: body.maxParticipants,
      confirmationMode: body.confirmationMode,
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
      await this.registrationService.updateRegistrationsComputedDataByCamp(
        updatedCamp,
      );
    }

    await this.realtimeService.emit(
      updatedCamp.id,
      'camp',
      updatedCamp.id,
      'updated',
    );

    res.resource(new CampDetailsResource(updatedCamp));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.destroy);

    await this.campService.deleteCampById(campId);

    await this.realtimeService.emit(campId, 'camp', campId, 'deleted');

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

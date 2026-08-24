import { EventService } from './event.service.js';
import { EventResource, EventDetailsResource } from './event.resource.js';
import { FileService } from '#app/file/file.service';
import { RegistrationService } from '#app/registration/registration.service';
import { TableTemplateService } from '#app/tableTemplate/table-template.service';
import httpStatus from 'http-status';
import {
  defaultMessageTemplatesForCountries,
  getEventPreset,
  localesForCountries,
} from '#app/event/presets/index.js';
import validator from './event.validation.js';
import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import { EventManagerService } from '#app/eventManager/event-manager.service.js';
import { RealtimeService } from '#core/realtime/RealtimeService';
import ApiError from '#utils/ApiError';
import { inject, injectable } from 'inversify';

@injectable()
export class EventController extends BaseController {
  constructor(
    @inject(EventService) private readonly eventService: EventService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(EventManagerService)
    private readonly managerService: EventManagerService,
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
    const event = req.modelOrFail('event');

    res.resource(new EventDetailsResource(event));
  }

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);

    const showUnlisted = query.view === 'all' || query.view === 'assigned';

    const { events, nextCursor, limit, total } =
      await this.eventService.queryEvents(
        {
          managerUserId:
            query.view === 'assigned' ? req.authUserId() : undefined,
          listed: showUnlisted ? query.listed : true,
          name: query.name,
          country: query.country,
          age: query.age,
          startAt: query.startAt,
          endAt: query.endAt,
          status: query.status,
        },
        {
          cursor: query.cursor,
          limit: query.limit,
          sortBy: query.sortBy ?? 'startAt',
          sortType: query.sortType ?? 'asc',
        },
      );

    res.resource(
      EventResource.collection(events).withCursor(nextCursor, limit, total),
    );
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const userId = req.authUserId();
    const organization = req.modelOrFail('organization');

    // Check if the user is allowed to create a event based on the reference event
    // This must happen here because the body needs to be validated first
    if (body.referenceEventId) {
      const isManager =
        await this.managerService.eventManagerExistsWithUserIdAndEventId(
          body.referenceEventId,
          userId,
        );

      if (!isManager) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'You are not allowed to create a event based on this reference event.',
        );
      }
    }

    const referenceEvent = body.referenceEventId
      ? await this.eventService.getEventById(body.referenceEventId)
      : undefined;

    // Verify that the countries of the new event match the countries of the reference event
    // This is important to ensure that the translations are present
    if (referenceEvent) {
      const countriesMatch =
        referenceEvent.countries.length === body.countries.length &&
        referenceEvent.countries.every((country) =>
          body.countries.includes(country),
        );

      if (!countriesMatch) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'The countries of the new event must match the countries of the reference event.',
        );
      }
    }

    const preset = getEventPreset(
      body.preset,
      localesForCountries(body.countries),
    );

    const form = body.form ?? referenceEvent?.form ?? preset.form;
    const themes = body.themes ?? referenceEvent?.themes ?? preset.themes;

    // Copy files from reference event when cloning; no default files otherwise
    const files = body.referenceEventId
      ? await this.fileService.queryModelFiles({
          name: 'event',
          id: body.referenceEventId,
        })
      : [];

    // Copy table templates from reference event when cloning; otherwise use preset
    const tableTemplates = body.referenceEventId
      ? await this.tableTemplateService.queryTemplates(body.referenceEventId)
      : preset.tableTemplates.map((value) => ({ data: value }));

    const messageTemplates = body.referenceEventId
      ? await this.messageTemplateService.queryMessageTemplates(
          body.referenceEventId,
        )
      : defaultMessageTemplatesForCountries(body.countries);

    const event = await this.eventService.createEvent(
      userId,
      {
        organizationId: organization.id,
        countries: body.countries,
        name: body.name,
        organizer: body.organizer,
        contactEmail: body.contactEmail,
        listed: body.listed ?? false,
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

    res.status(httpStatus.CREATED).resource(new EventDetailsResource(event));
  }

  async updateOrganization(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const organization = req.modelOrFail('organization');
    await req.validate(validator.updateOrganization);

    const updatedEvent = await this.eventService.moveEventToOrganization(
      event.id,
      organization.id,
    );

    void this.realtimeService.emit(event.id, 'event', event.id, 'updated');

    res.resource(new EventResource(updatedEvent));
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const { body } = await req.validate(validator.update(event));

    const updatedEvent = await this.eventService.updateEvent(event, {
      name: body.name,
      organizer: body.organizer,
      contactEmail: body.contactEmail,
      listed: body.listed,
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
      await this.registrationService.updateRegistrationsComputedDataByEvent(
        updatedEvent,
      );
    }

    void this.realtimeService.emit(
      updatedEvent.id,
      'event',
      updatedEvent.id,
      'updated',
    );

    res.resource(new EventDetailsResource(updatedEvent));
  }

  async destroy(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.destroy);

    await this.eventService.deleteEventById(event.id);

    void this.realtimeService.emit(event.id, 'event', event.id, 'deleted');

    res.sendStatus(httpStatus.NO_CONTENT);
  }
}

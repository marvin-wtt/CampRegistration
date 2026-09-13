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
import { SettingService } from '#app/setting/setting.service';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
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
    @inject(SettingService)
    private readonly settingService: SettingService,
    @inject(PrivacyNoticeService)
    private readonly privacyNoticeService: PrivacyNoticeService,
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

    const referenceEvent = body.referenceEventId
      ? await this.loadReferenceEvent(
          body.referenceEventId,
          userId,
          body.countries,
        )
      : undefined;

    const preset = getEventPreset(
      body.preset,
      localesForCountries(body.countries),
    );

    const cloned = body.referenceEventId
      ? await this.cloneReferenceEventResources(body.referenceEventId)
      : undefined;

    const form = body.form ?? referenceEvent?.form ?? preset.form;
    const themes = body.themes ?? referenceEvent?.themes ?? preset.themes;
    const files = cloned?.files ?? [];
    const tableTemplates =
      cloned?.tableTemplates ??
      preset.tableTemplates.map((value) => ({ data: value }));
    const messageTemplates =
      cloned?.messageTemplates ??
      defaultMessageTemplatesForCountries(body.countries);
    const settings = cloned?.settings ?? [];

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
        timezone: body.timezone,
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
      settings,
    );

    // Privacy notice versions aren't part of the event's own row, so they
    // can't ride along in `createEvent`'s single insert — copy them over in
    // a step of their own now that the new event exists.
    if (body.referenceEventId) {
      await this.privacyNoticeService.copyEventAddendum(
        body.referenceEventId,
        event.id,
        organization.id,
      );
    }

    res.status(httpStatus.CREATED).resource(new EventDetailsResource(event));
  }

  /**
   * Confirms the caller may clone the reference event and that its countries
   * match the new event's, then returns it for its form/themes fallback.
   */
  private async loadReferenceEvent(
    referenceEventId: string,
    userId: string,
    countries: string[],
  ) {
    const isManager =
      await this.managerService.eventManagerExistsWithUserIdAndEventId(
        referenceEventId,
        userId,
      );

    if (!isManager) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not allowed to create a event based on this reference event.',
      );
    }

    const referenceEvent =
      await this.eventService.getEventById(referenceEventId);

    // Verify that the countries of the new event match the countries of the reference event
    // This is important to ensure that the translations are present
    if (referenceEvent) {
      const countriesMatch =
        referenceEvent.countries.length === countries.length &&
        referenceEvent.countries.every((country) =>
          countries.includes(country),
        );

      if (!countriesMatch) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'The countries of the new event must match the countries of the reference event.',
        );
      }
    }

    return referenceEvent;
  }

  /** Everything cloned off a reference event that isn't the event row itself. */
  private async cloneReferenceEventResources(referenceEventId: string) {
    const [files, tableTemplates, messageTemplates, settings] =
      await Promise.all([
        this.fileService.queryModelFiles({
          name: 'event',
          id: referenceEventId,
        }),
        this.tableTemplateService.queryTemplates(referenceEventId),
        this.messageTemplateService.queryMessageTemplates(referenceEventId),
        this.settingService.querySettings(referenceEventId),
      ]);

    return { files, tableTemplates, messageTemplates, settings };
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
      timezone: body.timezone,
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

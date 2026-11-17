import { EventService } from './event.service.js';
import { EventResource, EventDetailsResource } from './event.resource.js';
import { FileService } from '#app/file/file.service';
import { RegistrationService } from '#app/registration/registration.service';
import { TableTemplateService } from '#app/tableTemplate/table-template.service';
import httpStatus from 'http-status';
import { presetSeed } from '#app/event/presets/index.js';
import validator from './event.validation.js';
import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import { EventManagerService } from '#app/eventManager/event-manager.service.js';
import { SettingService } from '#app/setting/setting.service';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { FinanceCategoryService } from '#app/financeCategory/finance-category.service';
import ApiError from '#core/router/ApiError';
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
    @inject(FinanceCategoryService)
    private readonly financeCategoryService: FinanceCategoryService,
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

    const { form, themes, ...seed } = body.referenceEventId
      ? await this.cloneReferenceEvent(
          body.referenceEventId,
          userId,
          body.countries,
        )
      : {
          ...presetSeed(body.preset, body.countries),
          financeCategories: this.financeCategoryService.defaultCategories(
            body.countries,
          ),
        };

    const event = await this.eventService.createEvent({
      directorId: userId,
      event: {
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
        currency: body.currency ?? 'EUR',
        location: body.location,
        form: body.form ?? form,
        themes: body.themes ?? themes,
      },
      seed,
    });

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
   * match the new event's, then copies its form, themes and child records.
   */
  private async cloneReferenceEvent(
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

    if (!referenceEvent) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reference event not found.');
    }

    // Matching countries guarantee the cloned content has every translation
    const countriesMatch =
      referenceEvent.countries.length === countries.length &&
      referenceEvent.countries.every((country) => countries.includes(country));

    if (!countriesMatch) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'The countries of the new event must match the countries of the reference event.',
      );
    }

    const [
      files,
      tableTemplates,
      messageTemplates,
      settings,
      financeCategories,
    ] = await Promise.all([
      this.fileService.queryModelFiles({
        name: 'event',
        id: referenceEventId,
      }),
      this.tableTemplateService.queryTemplates(referenceEventId),
      this.messageTemplateService.queryMessageTemplates(referenceEventId),
      this.settingService.querySettings(referenceEventId),
      this.financeCategoryService.cloneCategories(referenceEventId),
    ]);

    return {
      form: referenceEvent.form,
      themes: referenceEvent.themes,
      files,
      tableTemplates,
      messageTemplates,
      settings,
      financeCategories,
    };
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
      currency: body.currency,
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

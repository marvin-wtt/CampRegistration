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
import { SettingService } from '#app/setting/setting.service';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { FinanceCategoryService } from '#app/financeCategory/finance-category.service';
import ApiError from '#core/router/ApiError';
import type { EventCopyPart } from '@camp-registration/common/permissions';
import { inject, injectable } from 'inversify';

@injectable()
export class EventController extends BaseController {
  constructor(
    @inject(EventService) private readonly eventService: EventService,
    @inject(FileService) private readonly fileService: FileService,
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

    const { form, themes, privacyNotice, ...seed } = body.referenceEventId
      ? await this.cloneReferenceEvent(body.referenceEventId, body.countries)
      : {
          ...presetSeed(body.preset, body.countries),
          privacyNotice: undefined,
          financeCategories: this.financeCategoryService.defaultCategories(
            body.countries,
          ),
        };

    const event = await this.eventService.createEvent({
      userId,
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
    // can't ride along in `createEvent`'s single insert.
    await privacyNotice?.(event.id, organization.id);

    res.status(httpStatus.CREATED).resource(new EventDetailsResource(event));
  }

  /**
   * Loads each part the copy takes, once the reference's countries are known to
   * match the new event's. `canCopyReferenceEvent` has authorized the copy.
   */
  private async cloneReferenceEvent(
    referenceEventId: string,
    countries: string[],
  ) {
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
      financePrefixes,
    ] = await Promise.all([
      this.fileService.queryModelFiles({
        name: 'event',
        id: referenceEventId,
      }),
      this.tableTemplateService.queryTemplates(referenceEventId),
      this.messageTemplateService.queryMessageTemplates(referenceEventId),
      this.settingService.querySettings(referenceEventId),
      this.financeCategoryService.cloneCategories(referenceEventId),
      this.eventService.getFinancePrefixes(referenceEventId),
    ]);

    // Keyed by EVENT_COPY_PERMISSIONS: a part without permissions is an error.
    return {
      form: referenceEvent.form,
      themes: referenceEvent.themes,
      privacyNotice: (eventId: string, organizationId: string) =>
        this.privacyNoticeService.copyEventAddendum(
          referenceEventId,
          eventId,
          organizationId,
        ),
      files,
      tableTemplates,
      messageTemplates,
      settings,
      financeCategories,
      financePrefixes,
    } satisfies Record<EventCopyPart, unknown>;
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
      archived: body.archived,
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

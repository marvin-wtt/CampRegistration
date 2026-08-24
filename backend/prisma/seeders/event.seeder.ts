import { EventFactory } from '../factories';
import { BaseSeeder } from './BaseSeeder';
import { RegistrationSeeder } from './registration.seeder';
import { ProgramItemSeeder } from './program-item.seeder';
import { MessageSeeder } from './message.seeder';
import { RoomSeeder } from './room.seeder';
import { EventSettingSeeder } from './event-setting.seeder';
import { EventFileSeeder } from './file.seeder';
import {
  EVENT_PRESETS,
  defaultMessageTemplatesForCountries,
} from '#app/event/presets/index.js';
import { summerCampForm } from './forms/summer-camp.form';
import { EVENT_IDS, ORGANIZATION_IDS } from './ids';
import { PHASE, seedDate } from './timeline';
import type { Prisma } from '#generated/prisma/client.js';

/**
 * The table templates a event created through the UI would get from its preset.
 * The flagship and the two legacy events have hand-written ones instead — see
 * `table-template.seeder.ts`.
 */
function presetTableTemplates(
  preset: keyof typeof EVENT_PRESETS,
): Prisma.EventCreateInput['tableTemplates'] {
  return {
    create: EVENT_PRESETS[preset].tableTemplates.map((data) => ({ data })),
  };
}

class EventSeeder extends BaseSeeder {
  name(): string {
    return 'event';
  }

  async run(): Promise<void> {
    await this.seedFlagshipEvent();
    await this.seedYouthAdventuresEvents();
    await this.seedAlpineExplorersEvents();
    await this.seedUnverifiedOrganizationEvents();
    await this.seedForeignEvent();
  }

  /**
   * "Summer Camp": the one event with every child model populated — two
   * countries, five locales, registrations in every status, rooms and beds,
   * a full program, message history, documents and both event settings.
   */
  private async seedFlagshipEvent(): Promise<void> {
    const event = await EventFactory.create({
      id: EVENT_IDS.summer,
      organization: { connect: { id: ORGANIZATION_IDS.youthAdventures } },
      listed: true,
      confirmationMode: 'MANUAL',
      countries: ['gb', 'fr'],
      name: { gb: 'Summer Camp', fr: 'Colonie de vacances' },
      organizer: { gb: 'Youth Adventures UK', fr: 'Aventures Jeunesse' },
      contactEmail: { gb: 'event-gb@example.com', fr: 'event-fr@example.com' },
      maxParticipants: { gb: 24, fr: 25 },
      minAge: 7,
      maxAge: 12,
      startAt: seedDate(PHASE.upcoming.start, '15:00'),
      endAt: seedDate(PHASE.upcoming.end, '10:00'),
      registrationOpensAt: seedDate(-60, '08:00'),
      registrationClosesAt: seedDate(PHASE.upcoming.start - 14, '23:59'),
      price: 200,
      location: 'Blackthorn Manor, Somerset',
      form: summerCampForm,
      messageTemplates: {
        createMany: {
          data: defaultMessageTemplatesForCountries(['gb', 'fr']),
        },
      },
      createdAt: seedDate(-70),
      updatedAt: seedDate(-3),
    });

    await new RegistrationSeeder(event).seed(24, {
      country: 'gb',
      status: 'ACCEPTED',
    });
    await new RegistrationSeeder(event).seed(5, {
      country: 'gb',
      status: 'WAITLISTED',
    });
    await new RegistrationSeeder(event).seed(20, {
      country: 'fr',
      status: 'ACCEPTED',
    });
    await new RegistrationSeeder(event).seed(3, {
      country: 'fr',
      status: 'PENDING',
    });
    // Counselors are excluded from the room planner's default role filter.
    await new RegistrationSeeder(event).seed(6, {
      role: 'counselor',
      status: 'ACCEPTED',
    });

    await new ProgramItemSeeder(event).seed();
    await new MessageSeeder(event).seed();
    await new RoomSeeder(event).seed();
    await new EventSettingSeeder(event).seed();

    // The form links its rules and terms through {_file.<slot>}, so both are
    // uploaded in both of the event's locales; the other two documents belong
    // to no slot and only show up on the files page.
    const files = new EventFileSeeder(event);
    await files.seedFormSlots();
    await files.seedDocument('packing_list', 'public');
    await files.seedDocument('insurance', 'private');
  }

  /**
   * The remaining events of the organization John administers. His event role is
   * always merged with ORGANIZATION_EVENT_PERMISSIONS here, so these are not the
   * place to test a narrow role — the pure ones live under Alpine Explorers.
   */
  private async seedYouthAdventuresEvents(): Promise<void> {
    const organization = {
      connect: { id: ORGANIZATION_IDS.youthAdventures },
    };

    // Registration collects file uploads.
    const files = await EventFactory.create({
      id: EVENT_IDS.files,
      organization,
      name: 'Files Event',
      organizer: 'Youth Adventures UK',
      listed: true,
      countries: ['gb'],
      maxParticipants: 30,
      minAge: 10,
      maxAge: 16,
      startAt: seedDate(60, '15:00'),
      endAt: seedDate(67, '10:00'),
      // Not open yet: the public page must show the countdown, not the form.
      registrationOpensAt: seedDate(20, '08:00'),
      price: 150,
      location: 'Riverside Lodge',
      form: {
        name: 'Files test event',
        description: 'Event without special fields or translations',
        elements: [
          {
            name: 'first_name',
            type: 'text',
            required: true,
            eventDataType: 'first_name',
          },
          {
            name: 'files',
            type: 'file',
            required: true,
            allowMultiple: true,
          },
        ],
      },
    });

    await new RegistrationSeeder(files).seed(6, { status: 'ACCEPTED' });

    // John manages this one only through his organization ADMIN role: it must
    // stay out of "assigned events" and expose nothing but event.view /
    // event.edit / event.managers.view.
    const autumn = await EventFactory.create({
      id: EVENT_IDS.autumn,
      organization,
      name: 'Autumn Retreat',
      organizer: 'Youth Adventures UK',
      listed: true,
      countries: ['gb'],
      maxParticipants: 18,
      minAge: 14,
      maxAge: 18,
      startAt: seedDate(120, '16:00'),
      endAt: seedDate(124, '10:00'),
      registrationOpensAt: seedDate(-10, '08:00'),
      price: 95,
      location: 'Hollow Brook Retreat',
      form: EVENT_PRESETS.minimal.form,
      tableTemplates: presetTableTemplates('minimal'),
    });

    await new RegistrationSeeder(autumn).seed(9, { status: 'ACCEPTED' });

    // Deliberately without documents: its preset form declares a {_file.toc}
    // slot nothing was ever uploaded for, which is what the files page warns
    // about.

    const spring = await EventFactory.create({
      id: EVENT_IDS.spring,
      organization,
      name: 'Spring Event',
      organizer: 'Youth Adventures UK',
      listed: true,
      countries: ['gb'],
      maxParticipants: 25,
      minAge: 7,
      maxAge: 12,
      startAt: seedDate(PHASE.recentlyEnded.start, '15:00'),
      endAt: seedDate(PHASE.recentlyEnded.end, '10:00'),
      registrationOpensAt: seedDate(-120, '08:00'),
      registrationClosesAt: seedDate(PHASE.recentlyEnded.start - 7, '23:59'),
      price: 180,
      location: 'Blackthorn Manor, Somerset',
      form: EVENT_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    await new RegistrationSeeder(spring).seed(22, { status: 'ACCEPTED' });
    await new RoomSeeder(spring).seed();
    await new EventFileSeeder(spring).seedFormSlots();

    const winter = await EventFactory.create({
      id: EVENT_IDS.winter,
      organization,
      name: 'Winter Event',
      organizer: 'Youth Adventures UK',
      listed: false,
      countries: ['gb'],
      maxParticipants: 30,
      minAge: 10,
      maxAge: 16,
      startAt: seedDate(PHASE.past.start, '15:00'),
      endAt: seedDate(PHASE.past.end, '10:00'),
      registrationOpensAt: seedDate(-250, '08:00'),
      registrationClosesAt: seedDate(PHASE.past.start - 14, '23:59'),
      price: 210,
      location: 'Snowfield Chalet',
      form: EVENT_PRESETS.minimal.form,
      tableTemplates: presetTableTemplates('minimal'),
    });

    await new RegistrationSeeder(winter).seed(26, { status: 'ACCEPTED' });
    await new EventFileSeeder(winter).seedFormSlots();
  }

  /**
   * Events of the organization where John is a plain MEMBER. His event role is
   * the whole of his access here, nothing is merged in, so this is where a
   * narrow role can actually be observed.
   */
  private async seedAlpineExplorersEvents(): Promise<void> {
    const organization = { connect: { id: ORGANIZATION_IDS.alpineExplorers } };

    // COORDINATOR: everything except deleting the event and managing managers.
    const mountain = await EventFactory.create({
      id: EVENT_IDS.mountainWeeks,
      organization,
      name: { de: 'Bergwochen', en: 'Mountain Weeks' },
      organizer: 'Alpine Explorers',
      contactEmail: 'bergwochen@alpine-explorers.example.com',
      listed: true,
      countries: ['de'],
      maxParticipants: 32,
      minAge: 12,
      maxAge: 17,
      startAt: seedDate(75, '14:00'),
      endAt: seedDate(89, '11:00'),
      registrationOpensAt: seedDate(-45, '08:00'),
      price: 320,
      location: 'Garmisch-Partenkirchen',
      form: EVENT_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    await new RegistrationSeeder(mountain).seed(17, { status: 'ACCEPTED' });
    await new RegistrationSeeder(mountain).seed(2, { status: 'PENDING' });
    await new EventFileSeeder(mountain).seedFormSlots();

    // COUNSELOR, and running right now: the dashboard, program planner and room
    // planner all show a event in progress, with a role that may not edit it.
    const city = await EventFactory.create({
      id: EVENT_IDS.city,
      organization,
      name: { de: 'Stadtwoche', en: 'City Event' },
      organizer: 'Alpine Explorers',
      contactEmail: 'stadtwoche@alpine-explorers.example.com',
      listed: true,
      countries: ['de'],
      maxParticipants: 40,
      minAge: 12,
      maxAge: 17,
      startAt: seedDate(PHASE.ongoing.start, '14:00'),
      endAt: seedDate(PHASE.ongoing.end, '11:00'),
      registrationOpensAt: seedDate(-90, '08:00'),
      registrationClosesAt: seedDate(-7, '23:59'),
      price: 120,
      location: 'München',
      form: EVENT_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    await new RegistrationSeeder(city).seed(28, { status: 'ACCEPTED' });
    await new RegistrationSeeder(city).seed(4, { status: 'WAITLISTED' });
    await new RoomSeeder(city).seed();
    await new EventSettingSeeder(city).seed();
    await new EventFileSeeder(city).seedFormSlots();

    // VIEWER: every list is readable, every action must be gone.
    const simple = await EventFactory.create({
      id: EVENT_IDS.simple,
      organization,
      name: 'Simple Event',
      organizer: 'Alpine Explorers',
      contactEmail: 'info@alpine-explorers.example.com',
      listed: true,
      countries: ['de'],
      maxParticipants: 20,
      minAge: 8,
      maxAge: 14,
      startAt: seedDate(45, '15:00'),
      endAt: seedDate(52, '10:00'),
      // No window at all — registration is always open.
      registrationOpensAt: null,
      registrationClosesAt: null,
      price: 80,
      location: 'Kempten',
      form: {
        name: 'Simple test event',
        description: 'Event without special fields or translations',
        elements: [
          {
            name: 'first_name',
            type: 'text',
            required: true,
            eventDataType: 'first_name',
          },
          {
            name: 'last_name',
            type: 'text',
            required: true,
            eventDataType: 'last_name',
          },
        ],
      },
    });

    await new RegistrationSeeder(simple).seed(11, { status: 'ACCEPTED' });
    await new RoomSeeder(simple).seed();

    // John's manager record here is expired — access must be gone even though
    // the record still exists.
    const glacier = await EventFactory.create({
      id: EVENT_IDS.glacierTrek,
      organization,
      name: { de: 'Gletschertour', en: 'Glacier Trek' },
      organizer: 'Alpine Explorers',
      contactEmail: 'gletscher@alpine-explorers.example.com',
      listed: true,
      countries: ['de'],
      maxParticipants: 16,
      minAge: 15,
      maxAge: 18,
      startAt: seedDate(110, '09:00'),
      endAt: seedDate(117, '17:00'),
      registrationOpensAt: seedDate(-20, '08:00'),
      price: 410,
      location: 'Pitztal',
      form: EVENT_PRESETS.minimal.form,
      tableTemplates: presetTableTemplates('minimal'),
    });

    await new EventFileSeeder(glacier).seedFormSlots();
  }

  /** Events whose organization is not (or no longer) verified. */
  private async seedUnverifiedOrganizationEvents(): Promise<void> {
    // PENDING organization: `listed` is true, yet the event is kept out of the
    // directory and refuses registrations until the organization is verified.
    const printemps = await EventFactory.create({
      id: EVENT_IDS.printemps,
      organization: { connect: { id: ORGANIZATION_IDS.nouvelleAssociation } },
      name: { fr: 'Colonie de Printemps', en: 'Spring Colony' },
      organizer: 'Nouvelle Association',
      contactEmail: 'colonie@nouvelle-association.example.com',
      listed: true,
      countries: ['fr'],
      maxParticipants: 22,
      minAge: 8,
      maxAge: 13,
      startAt: seedDate(140, '15:00'),
      endAt: seedDate(147, '10:00'),
      registrationOpensAt: seedDate(-5, '08:00'),
      price: 260,
      location: 'Ardèche',
      form: EVENT_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    // Registrations that were captured on paper — the guard only blocks the
    // public endpoint, so the list is not necessarily empty.
    await new RegistrationSeeder(printemps).seed(3, { status: 'PENDING' });
    await new EventFileSeeder(printemps).seedFormSlots();

    // REJECTED organization: the rejection unpublished the event.
    const harbour = await EventFactory.create({
      id: EVENT_IDS.harbourSailing,
      organization: { connect: { id: ORGANIZATION_IDS.harbourTrust } },
      name: 'Harbour Sailing Week',
      organizer: 'Harbour Youth Trust',
      contactEmail: 'sailing@harbour-trust.example.com',
      listed: false,
      countries: ['gb'],
      maxParticipants: 12,
      minAge: 13,
      maxAge: 18,
      startAt: seedDate(80, '10:00'),
      endAt: seedDate(85, '16:00'),
      registrationOpensAt: seedDate(-30, '08:00'),
      price: 300,
      location: 'Plymouth Marina',
      form: EVENT_PRESETS.minimal.form,
      tableTemplates: presetTableTemplates('minimal'),
    });

    // Taken before the organization was rejected.
    await new RegistrationSeeder(harbour).seed(4, { status: 'ACCEPTED' });
    await new EventFileSeeder(harbour).seedFormSlots();
  }

  /** A event John has no relationship to at all. */
  private async seedForeignEvent(): Promise<void> {
    const seaside = await EventFactory.create({
      id: EVENT_IDS.seaside,
      organization: { connect: { id: ORGANIZATION_IDS.coastalEvents } },
      name: 'Seaside Event',
      organizer: 'Coastal Events',
      contactEmail: 'seaside@coastal-events.example.com',
      listed: true,
      countries: ['gb'],
      maxParticipants: 36,
      minAge: 9,
      maxAge: 15,
      startAt: seedDate(55, '15:00'),
      endAt: seedDate(62, '10:00'),
      registrationOpensAt: seedDate(-40, '08:00'),
      price: 175,
      location: 'Brighton Beach House',
      form: EVENT_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    await new RegistrationSeeder(seaside).seed(12, { status: 'ACCEPTED' });
    await new EventFileSeeder(seaside).seedFormSlots();
  }
}

export default new EventSeeder();

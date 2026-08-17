import { CampFactory } from '../factories';
import { BaseSeeder } from './BaseSeeder';
import { RegistrationSeeder } from './registration.seeder';
import { ProgramEventSeeder } from './program-event.seeder';
import { MessageSeeder } from './message.seeder';
import { RoomSeeder } from './room.seeder';
import { CampSettingSeeder } from './camp-setting.seeder';
import { CampFileSeeder } from './file.seeder';
import {
  CAMP_PRESETS,
  defaultMessageTemplatesForCountries,
} from '#app/camp/presets/index.js';
import { summerCampForm } from './forms/summer-camp.form';
import { CAMP_IDS, ORGANIZATION_IDS } from './ids';
import { PHASE, seedDate } from './timeline';
import type { Prisma } from '#generated/prisma/client.js';

/**
 * The table templates a camp created through the UI would get from its preset.
 * The flagship and the two legacy camps have hand-written ones instead — see
 * `table-template.seeder.ts`.
 */
function presetTableTemplates(
  preset: keyof typeof CAMP_PRESETS,
): Prisma.CampCreateInput['tableTemplates'] {
  return {
    create: CAMP_PRESETS[preset].tableTemplates.map((data) => ({ data })),
  };
}

class CampSeeder extends BaseSeeder {
  name(): string {
    return 'camp';
  }

  async run(): Promise<void> {
    await this.seedFlagshipCamp();
    await this.seedYouthAdventuresCamps();
    await this.seedAlpineExplorersCamps();
    await this.seedUnverifiedOrganizationCamps();
    await this.seedForeignCamp();
  }

  /**
   * "Summer Camp": the one camp with every child model populated — two
   * countries, five locales, registrations in every status, rooms and beds,
   * a full program, message history, documents and both camp settings.
   */
  private async seedFlagshipCamp(): Promise<void> {
    const camp = await CampFactory.create({
      id: CAMP_IDS.summer,
      organization: { connect: { id: ORGANIZATION_IDS.youthAdventures } },
      public: true,
      confirmationMode: 'MANUAL',
      countries: ['gb', 'fr'],
      name: { gb: 'Summer Camp', fr: 'Colonie de vacances' },
      organizer: { gb: 'Youth Adventures UK', fr: 'Aventures Jeunesse' },
      contactEmail: { gb: 'camp-gb@example.com', fr: 'camp-fr@example.com' },
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

    await new RegistrationSeeder(camp).seed(24, {
      country: 'gb',
      status: 'ACCEPTED',
    });
    await new RegistrationSeeder(camp).seed(5, {
      country: 'gb',
      status: 'WAITLISTED',
    });
    await new RegistrationSeeder(camp).seed(20, {
      country: 'fr',
      status: 'ACCEPTED',
    });
    await new RegistrationSeeder(camp).seed(3, {
      country: 'fr',
      status: 'PENDING',
    });
    // Counselors are excluded from the room planner's default role filter.
    await new RegistrationSeeder(camp).seed(6, {
      role: 'counselor',
      status: 'ACCEPTED',
    });

    await new ProgramEventSeeder(camp).seed();
    await new MessageSeeder(camp).seed();
    await new RoomSeeder(camp).seed();
    await new CampSettingSeeder(camp).seed();

    // The form links its rules and terms through {_file.<slot>}, so both are
    // uploaded in both of the camp's locales; the other two documents belong
    // to no slot and only show up on the files page.
    const files = new CampFileSeeder(camp);
    await files.seedFormSlots();
    await files.seedDocument('packing_list', 'public');
    await files.seedDocument('insurance', 'private');
  }

  /**
   * The remaining camps of the organization John administers. His camp role is
   * always merged with ORGANIZATION_CAMP_PERMISSIONS here, so these are not the
   * place to test a narrow role — the pure ones live under Alpine Explorers.
   */
  private async seedYouthAdventuresCamps(): Promise<void> {
    const organization = {
      connect: { id: ORGANIZATION_IDS.youthAdventures },
    };

    // Registration collects file uploads.
    const files = await CampFactory.create({
      id: CAMP_IDS.files,
      organization,
      name: 'Files Camp',
      organizer: 'Youth Adventures UK',
      public: true,
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
        name: 'Files test camp',
        description: 'Camp without special fields or translations',
        elements: [
          {
            name: 'first_name',
            type: 'text',
            required: true,
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
    // stay out of "assigned camps" and expose nothing but camp.view /
    // camp.edit / camp.managers.view.
    const autumn = await CampFactory.create({
      id: CAMP_IDS.autumn,
      organization,
      name: 'Autumn Retreat',
      organizer: 'Youth Adventures UK',
      public: true,
      countries: ['gb'],
      maxParticipants: 18,
      minAge: 14,
      maxAge: 18,
      startAt: seedDate(120, '16:00'),
      endAt: seedDate(124, '10:00'),
      registrationOpensAt: seedDate(-10, '08:00'),
      price: 95,
      location: 'Hollow Brook Retreat',
      form: CAMP_PRESETS.minimal.form,
      tableTemplates: presetTableTemplates('minimal'),
    });

    await new RegistrationSeeder(autumn).seed(9, { status: 'ACCEPTED' });

    // Deliberately without documents: its preset form declares a {_file.toc}
    // slot nothing was ever uploaded for, which is what the files page warns
    // about.

    const spring = await CampFactory.create({
      id: CAMP_IDS.spring,
      organization,
      name: 'Spring Camp',
      organizer: 'Youth Adventures UK',
      public: true,
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
      form: CAMP_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    await new RegistrationSeeder(spring).seed(22, { status: 'ACCEPTED' });
    await new RoomSeeder(spring).seed();
    await new CampFileSeeder(spring).seedFormSlots();

    const winter = await CampFactory.create({
      id: CAMP_IDS.winter,
      organization,
      name: 'Winter Camp',
      organizer: 'Youth Adventures UK',
      public: false,
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
      form: CAMP_PRESETS.minimal.form,
      tableTemplates: presetTableTemplates('minimal'),
    });

    await new RegistrationSeeder(winter).seed(26, { status: 'ACCEPTED' });
    await new CampFileSeeder(winter).seedFormSlots();
  }

  /**
   * Camps of the organization where John is a plain MEMBER. His camp role is
   * the whole of his access here, nothing is merged in, so this is where a
   * narrow role can actually be observed.
   */
  private async seedAlpineExplorersCamps(): Promise<void> {
    const organization = { connect: { id: ORGANIZATION_IDS.alpineExplorers } };

    // COORDINATOR: everything except deleting the camp and managing managers.
    const mountain = await CampFactory.create({
      id: CAMP_IDS.mountainWeeks,
      organization,
      name: { de: 'Bergwochen', en: 'Mountain Weeks' },
      organizer: 'Alpine Explorers',
      contactEmail: 'bergwochen@alpine-explorers.example.com',
      public: true,
      countries: ['de'],
      maxParticipants: 32,
      minAge: 12,
      maxAge: 17,
      startAt: seedDate(75, '14:00'),
      endAt: seedDate(89, '11:00'),
      registrationOpensAt: seedDate(-45, '08:00'),
      price: 320,
      location: 'Garmisch-Partenkirchen',
      form: CAMP_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    await new RegistrationSeeder(mountain).seed(17, { status: 'ACCEPTED' });
    await new RegistrationSeeder(mountain).seed(2, { status: 'PENDING' });
    await new CampFileSeeder(mountain).seedFormSlots();

    // COUNSELOR, and running right now: the dashboard, program planner and room
    // planner all show a camp in progress, with a role that may not edit it.
    const city = await CampFactory.create({
      id: CAMP_IDS.city,
      organization,
      name: { de: 'Stadtwoche', en: 'City Camp' },
      organizer: 'Alpine Explorers',
      contactEmail: 'stadtwoche@alpine-explorers.example.com',
      public: true,
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
      form: CAMP_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    await new RegistrationSeeder(city).seed(28, { status: 'ACCEPTED' });
    await new RegistrationSeeder(city).seed(4, { status: 'WAITLISTED' });
    await new RoomSeeder(city).seed();
    await new CampSettingSeeder(city).seed();
    await new CampFileSeeder(city).seedFormSlots();

    // VIEWER: every list is readable, every action must be gone.
    const simple = await CampFactory.create({
      id: CAMP_IDS.simple,
      organization,
      name: 'Simple Camp',
      organizer: 'Alpine Explorers',
      contactEmail: 'info@alpine-explorers.example.com',
      public: true,
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
        name: 'Simple test camp',
        description: 'Camp without special fields or translations',
        elements: [
          {
            name: 'first_name',
            type: 'text',
            required: true,
          },
          {
            name: 'last_name',
            type: 'text',
            required: true,
          },
        ],
      },
    });

    await new RegistrationSeeder(simple).seed(11, { status: 'ACCEPTED' });
    await new RoomSeeder(simple).seed();

    // John's manager record here is expired — access must be gone even though
    // the record still exists.
    const glacier = await CampFactory.create({
      id: CAMP_IDS.glacierTrek,
      organization,
      name: { de: 'Gletschertour', en: 'Glacier Trek' },
      organizer: 'Alpine Explorers',
      contactEmail: 'gletscher@alpine-explorers.example.com',
      public: true,
      countries: ['de'],
      maxParticipants: 16,
      minAge: 15,
      maxAge: 18,
      startAt: seedDate(110, '09:00'),
      endAt: seedDate(117, '17:00'),
      registrationOpensAt: seedDate(-20, '08:00'),
      price: 410,
      location: 'Pitztal',
      form: CAMP_PRESETS.minimal.form,
      tableTemplates: presetTableTemplates('minimal'),
    });

    await new CampFileSeeder(glacier).seedFormSlots();
  }

  /** Camps whose organization is not (or no longer) verified. */
  private async seedUnverifiedOrganizationCamps(): Promise<void> {
    // PENDING organization: `public` is true, yet the camp is kept out of the
    // directory and refuses registrations until the organization is verified.
    const printemps = await CampFactory.create({
      id: CAMP_IDS.printemps,
      organization: { connect: { id: ORGANIZATION_IDS.nouvelleAssociation } },
      name: { fr: 'Colonie de Printemps', en: 'Spring Colony' },
      organizer: 'Nouvelle Association',
      contactEmail: 'colonie@nouvelle-association.example.com',
      public: true,
      countries: ['fr'],
      maxParticipants: 22,
      minAge: 8,
      maxAge: 13,
      startAt: seedDate(140, '15:00'),
      endAt: seedDate(147, '10:00'),
      registrationOpensAt: seedDate(-5, '08:00'),
      price: 260,
      location: 'Ardèche',
      form: CAMP_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    // Registrations that were captured on paper — the guard only blocks the
    // public endpoint, so the list is not necessarily empty.
    await new RegistrationSeeder(printemps).seed(3, { status: 'PENDING' });
    await new CampFileSeeder(printemps).seedFormSlots();

    // REJECTED organization: the rejection unpublished the camp.
    const harbour = await CampFactory.create({
      id: CAMP_IDS.harbourSailing,
      organization: { connect: { id: ORGANIZATION_IDS.harbourTrust } },
      name: 'Harbour Sailing Week',
      organizer: 'Harbour Youth Trust',
      contactEmail: 'sailing@harbour-trust.example.com',
      public: false,
      countries: ['gb'],
      maxParticipants: 12,
      minAge: 13,
      maxAge: 18,
      startAt: seedDate(80, '10:00'),
      endAt: seedDate(85, '16:00'),
      registrationOpensAt: seedDate(-30, '08:00'),
      price: 300,
      location: 'Plymouth Marina',
      form: CAMP_PRESETS.minimal.form,
      tableTemplates: presetTableTemplates('minimal'),
    });

    // Taken before the organization was rejected.
    await new RegistrationSeeder(harbour).seed(4, { status: 'ACCEPTED' });
    await new CampFileSeeder(harbour).seedFormSlots();
  }

  /** A camp John has no relationship to at all. */
  private async seedForeignCamp(): Promise<void> {
    const seaside = await CampFactory.create({
      id: CAMP_IDS.seaside,
      organization: { connect: { id: ORGANIZATION_IDS.coastalCamps } },
      name: 'Seaside Camp',
      organizer: 'Coastal Camps',
      contactEmail: 'seaside@coastal-camps.example.com',
      public: true,
      countries: ['gb'],
      maxParticipants: 36,
      minAge: 9,
      maxAge: 15,
      startAt: seedDate(55, '15:00'),
      endAt: seedDate(62, '10:00'),
      registrationOpensAt: seedDate(-40, '08:00'),
      price: 175,
      location: 'Brighton Beach House',
      form: CAMP_PRESETS.standard.form,
      tableTemplates: presetTableTemplates('standard'),
    });

    await new RegistrationSeeder(seaside).seed(12, { status: 'ACCEPTED' });
    await new CampFileSeeder(seaside).seedFormSlots();
  }
}

export default new CampSeeder();

import path from 'node:path';
import fse from 'fs-extra';
import { faker } from '@faker-js/faker/locale/en';
import type { Event, Prisma } from '#generated/prisma/client.js';
import { appPath } from '#utils/paths';
import { FileFactory } from '../factories';
import { eventLocales } from './locales';
import { createPdf } from './pdf';

interface SeedDocument {
  /** Shown in the file list and used as the download name. */
  name: string;
  lines: string[];
}

/** Matches the {_file.<slot>} placeholders a form uses to link a document. */
const SLOT_PATTERN = /\{\s?_file\.([a-z0-9_-]+)\s?}/g;

// Read straight from the environment rather than through `#config`: importing
// the config validates every environment variable the server needs, and the
// seed has no business failing over an unset NODE_ENV or SMTP host.
const UPLOAD_DIR = appPath(process.env.UPLOAD_DIR ?? 'storage/uploads');

const SLOT_DOCUMENTS: Record<string, Record<string, SeedDocument>> = {
  rules: {
    en: {
      name: 'Event rules.pdf',
      lines: [
        'Event rules',
        '',
        '1. We treat everyone with respect and look out for each other.',
        '2. Nobody leaves the site without telling a leader.',
        '3. Phones stay in the room during activities and meals.',
        '4. Alcohol, drugs and weapons are not allowed.',
        '5. Lights out is at 22:00 - the house stays quiet afterwards.',
      ],
    },
    de: {
      name: 'Lagerregeln.pdf',
      lines: [
        'Lagerregeln',
        '',
        '1. Wir gehen respektvoll miteinander um und passen aufeinander auf.',
        '2. Niemand verlässt das Gelände, ohne der Leitung Bescheid zu sagen.',
        '3. Handys bleiben während Programm und Mahlzeiten im Zimmer.',
        '4. Alkohol, Drogen und Waffen sind nicht erlaubt.',
        '5. Nachtruhe ist ab 22:00 Uhr.',
      ],
    },
    fr: {
      name: 'Règlement du event.pdf',
      lines: [
        'Règlement du event',
        '',
        '1. Nous nous respectons et veillons les uns sur les autres.',
        '2. Personne ne quitte le site sans prévenir un responsable.',
        '3. Les téléphones restent dans la chambre pendant les activités.',
        "4. L'alcool, les drogues et les armes sont interdits.",
        '5. Extinction des feux à 22h00.',
      ],
    },
  },
  toc: {
    en: {
      name: 'Terms and conditions.pdf',
      lines: [
        'General terms and conditions',
        '',
        'Registration is binding once we have confirmed it in writing.',
        'The participation fee is due four weeks before the event starts.',
        'Cancellations up to 30 days before the start are free of charge.',
        'Later cancellations are charged at 50% of the participation fee.',
        'The organizer may cancel the event if too few places are booked.',
      ],
    },
    de: {
      name: 'Allgemeine Geschäftsbedingungen.pdf',
      lines: [
        'Allgemeine Geschäftsbedingungen',
        '',
        'Die Anmeldung ist verbindlich, sobald wir sie schriftlich bestätigt haben.',
        'Der Teilnahmebeitrag ist vier Wochen vor Beginn fällig.',
        'Stornierungen bis 30 Tage vor Beginn sind kostenfrei.',
        'Danach werden 50% des Teilnahmebeitrags berechnet.',
        'Der Veranstalter kann das Event bei zu wenigen Anmeldungen absagen.',
      ],
    },
    fr: {
      name: 'Conditions générales.pdf',
      lines: [
        'Conditions générales',
        '',
        "L'inscription est ferme dès que nous l'avons confirmée par écrit.",
        'Les frais de participation sont dus quatre semaines avant le départ.',
        "Toute annulation jusqu'à 30 jours avant le départ est gratuite.",
        'Au-delà, 50% des frais de participation sont retenus.',
        "L'organisateur peut annuler le séjour faute d'inscriptions.",
      ],
    },
  },
};

/** Documents the flagship keeps next to its form slots, so the file list is not just consent PDFs. */
export const EXTRA_DOCUMENTS: Record<string, SeedDocument> = {
  packing_list: {
    name: 'Packing list.pdf',
    lines: [
      'What to pack',
      '',
      'Sleeping bag, pillow and a bath towel',
      'Rain jacket and sturdy walking shoes',
      'Swimwear for the lido day',
      'Torch for the night hike',
      'Any medication, handed to the event nurse on arrival',
    ],
  },
  insurance: {
    name: 'Insurance certificate.pdf',
    lines: [
      'Certificate of liability insurance',
      '',
      'Policy holder: Youth Adventures UK',
      'Cover: public liability, valid for the current season',
      '',
      'Internal document - not published on the registration form.',
    ],
  },
};

function declaredSlots(form: Record<string, unknown>): string[] {
  const matches = JSON.stringify(form).matchAll(SLOT_PATTERN);

  return [...new Set([...matches].map(([, slot]) => slot!))];
}

/**
 * Event documents, written to storage as real one-page PDFs so downloading them
 * works like an uploaded file would.
 */
export class EventFileSeeder {
  constructor(private event: Event) {}

  /**
   * One public document per {_file.<slot>} the event's form declares, in every
   * locale the event supports — the same thing a manager would upload on the
   * files page to make the form's document links resolve.
   */
  async seedFormSlots(): Promise<void> {
    const locales = eventLocales(this.event);

    for (const slot of declaredSlots(this.event.form)) {
      for (const locale of locales) {
        const document = SLOT_DOCUMENTS[slot]?.[locale];
        if (!document) {
          continue;
        }

        await this.write(document, `${slot}_${locale}`, {
          field: slot,
          locale,
          accessLevel: 'public',
        });
      }
    }
  }

  /** A document that belongs to no form slot, e.g. an internal attachment. */
  async seedDocument(
    key: keyof typeof EXTRA_DOCUMENTS,
    accessLevel: 'public' | 'private',
  ): Promise<void> {
    await this.write(EXTRA_DOCUMENTS[key]!, key, { accessLevel });
  }

  private async write(
    document: SeedDocument,
    key: string,
    data: { field?: string; locale?: string; accessLevel: string },
  ): Promise<void> {
    await writeDocument(document, `seed_${this.event.id}_${key}.pdf`, {
      event: { connect: { id: this.event.id } },
      ...data,
    });
  }
}

/**
 * A document a registrant uploaded through a file question of the form. It is
 * left unattached — a File row may only ever have one owner, so the caller
 * connects it to the registration it belongs to.
 */
export async function seedRegistrationUpload(
  event: Event,
  index: number,
  field: string,
) {
  return writeDocument(
    {
      name: `${field}.pdf`,
      lines: [
        'Uploaded document',
        '',
        'Attached to the registration through the form.',
      ],
    },
    `seed_${event.id}_upload_${String(index)}_${field}.pdf`,
    {
      // Form uploads are anonymous until the registration claims them, and are
      // filed under the session that sent them.
      field: faker.string.uuid(),
      accessLevel: 'private',
    },
  );
}

async function writeDocument(
  document: SeedDocument,
  // Deterministic storage names, unlike the ULIDs the upload path generates:
  // reseeding then overwrites its own PDFs instead of leaving the previous
  // run's copies behind in the storage directory.
  name: string,
  data: Partial<Prisma.FileCreateInput>,
) {
  const content = createPdf(document.lines);

  await fse.outputFile(path.join(UPLOAD_DIR, name), content);

  return FileFactory.create({
    name,
    originalName: document.name,
    type: 'application/pdf',
    size: content.length,
    storageLocation: 'disk',
    ...data,
  });
}

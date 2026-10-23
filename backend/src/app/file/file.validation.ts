import { z, type ZodType } from 'zod';
import type { ServiceFileUpdateData } from '@camp-registration/common/entities';
import {
  EVENT_BANNER_SLOT,
  EVENT_LOGO_SLOT,
} from '@camp-registration/common/form';

const stream = z.object({
  params: z.object({
    fileId: z.ulid(),
  }),
  query: z
    .object({
      download: z.boolean(),
    })
    .partial(),
});

// A country an event runs in, as event countries are stored (`gb`, `cz`).
const COUNTRY = z.string().regex(/^[a-z]{2}$/);

const show = z.object({
  params: z.object({
    fileId: z.ulid(),
  }),
});

const slotFile = z.object({
  params: z.object({
    slot: z.string().min(1),
  }),
  query: z
    .object({
      locale: z.string(),
      country: COUNTRY,
    })
    .partial(),
});

const index = z.object({
  query: z
    .object({
      page: z.number().int().positive(),
      name: z.string(),
      type: z.string(),
    })
    .partial(),
});

const metadata = z.object({
  name: z.string().optional(),
  field: z.string().optional(),
  locale: z.string().nullable().optional(),
  country: COUNTRY.nullable().optional(),
  accessLevel: z.enum(['private', 'public']).optional(),
}) satisfies ZodType<ServiceFileUpdateData>;

// The logo and banner are the event's own, the same in every country.
const COUNTRYLESS_FIELDS: readonly (string | null)[] = [
  EVENT_LOGO_SLOT,
  EVENT_BANNER_SLOT,
];

interface StoredFile {
  field: string | null;
  country: string | null;
}

/**
 * A file names only a country its owner runs in — an event's; nothing else has
 * any — and none for a slot that is the same everywhere. An update is checked
 * against the stored file it changes, but only when it touches the country or
 * the field, so an unrelated edit isn't rejected over what is already stored.
 */
const withCountryCheck = (countries: readonly string[], stored?: StoredFile) =>
  metadata.superRefine((body, ctx) => {
    if (body.country === undefined && body.field === undefined) {
      return;
    }

    const country = body.country === undefined ? stored?.country : body.country;
    if (!country) {
      return;
    }

    if (!countries.includes(country)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Not a country of the event',
        path: ['country'],
        input: country,
      });
    }

    const field = body.field ?? stored?.field ?? null;
    if (COUNTRYLESS_FIELDS.includes(field)) {
      ctx.addIssue({
        code: 'custom',
        message: 'This file applies to every country',
        path: ['country'],
        input: country,
      });
    }
  });

const store = (countries: readonly string[]) =>
  z.object({
    body: withCountryCheck(countries),
    file: z.custom<Express.Multer.File>((file) => {
      return file !== undefined;
    }),
  });

const update = (countries: readonly string[], stored: StoredFile) =>
  z.object({
    params: z.object({
      fileId: z.ulid(),
    }),
    body: withCountryCheck(countries, stored),
  });

const destroy = z.object({
  params: z.object({
    fileId: z.ulid(),
  }),
});

export default {
  stream,
  show,
  slotFile,
  index,
  store,
  update,
  destroy,
};

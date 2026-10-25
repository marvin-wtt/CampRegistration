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
      download: z.stringbool(),
    })
    .partial(),
});

// A group, by its country code as event countries are stored (`gb`, `cz`).
const GROUP = z.string().regex(/^[a-z]{2}$/);

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
      group: GROUP,
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
  group: GROUP.nullable().optional(),
  accessLevel: z.enum(['private', 'public']).optional(),
}) satisfies ZodType<ServiceFileUpdateData>;

// The logo and banner are the event's own, the same in every group.
const GROUPLESS_FIELDS: readonly (string | null)[] = [
  EVENT_LOGO_SLOT,
  EVENT_BANNER_SLOT,
];

interface StoredFile {
  field: string | null;
  group: string | null;
}

/**
 * A file names only a group its owner runs — an event's; nothing else has any
 * — and none for a slot that is the same everywhere. An update is checked
 * against the stored file it changes, but only when it touches the group or
 * the field, so an unrelated edit isn't rejected over what is already stored.
 */
const withGroupCheck = (groups: readonly string[], stored?: StoredFile) =>
  metadata.superRefine((body, ctx) => {
    if (body.group === undefined && body.field === undefined) {
      return;
    }

    const group = body.group === undefined ? stored?.group : body.group;
    if (!group) {
      return;
    }

    if (!groups.includes(group)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Not a group of the event',
        path: ['group'],
        input: group,
      });
    }

    const field = body.field ?? stored?.field ?? null;
    if (GROUPLESS_FIELDS.includes(field)) {
      ctx.addIssue({
        code: 'custom',
        message: 'This file applies to every group',
        path: ['group'],
        input: group,
      });
    }
  });

const store = (groups: readonly string[]) =>
  z.object({
    body: withGroupCheck(groups),
    file: z.custom<Express.Multer.File>((file) => {
      return file !== undefined;
    }),
  });

const update = (groups: readonly string[], stored: StoredFile) =>
  z.object({
    params: z.object({
      fileId: z.ulid(),
    }),
    body: withGroupCheck(groups, stored),
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

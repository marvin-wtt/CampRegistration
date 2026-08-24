import type { Prisma } from '#generated/prisma/client.js';

/**
 * The camp->event rename deliberately left a handful of `camp`-prefixed
 * strings alone because they are wire keys baked into already-saved content,
 * not code identifiers. They fall into two unrelated groups, each scoped to
 * its own columns, so they're migrated separately rather than through one
 * shared replacer:
 *  - SurveyJS/Handlebars content (`events.form`, `message_templates` and
 *    `messages` subject/body): form variables (`{camp.name}`,
 *    `{camp.startAt}`, ...) and the Handlebars merge tags admin-authored
 *    message/email text uses (`{{camp.name}}` — contains `{camp.` as a
 *    substring, so the same replacement covers both), plus the
 *    `campDataType` SurveyJS question property and its `campDataMapping`
 *    property type.
 *  - Privacy-notice catalogue keys (`privacy_notice_versions.content`):
 *    `camp_organisation`, `camp_staff`, `camp_end`.
 *
 * The code side of both is now renamed too (`eventDataType`, `event.`,
 * `event_organisation`/`event_staff`/`event_end`), so this migration brings
 * existing stored content in line. Each rewrites the JSON/text as a string
 * rather than walking the parsed structure — simpler, and safe here because
 * every pattern below is specific enough not to collide with genuine
 * admin-authored content.
 */

const BATCH_SIZE = 200;

function migrateFormWireKeys(text: string): string {
  return text
    .split('{camp.')
    .join('{event.')
    .split('campDataMapping')
    .join('eventDataMapping')
    .split('campDataType')
    .join('eventDataType');
}

function migratePrivacyWireKeys(text: string): string {
  return text
    .split('camp_organisation')
    .join('event_organisation')
    .split('camp_staff')
    .join('event_staff')
    .split('camp_end')
    .join('event_end');
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  await migrateEventForms(tx);
  await migrateMessageTemplates(tx);
  await migrateMessages(tx);
  await migratePrivacyNoticeVersions(tx);
}

async function migrateEventForms(tx: Prisma.TransactionClient): Promise<void> {
  let cursor: string | undefined;

  while (true) {
    const events = await tx.event.findMany({
      select: { id: true, form: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (events.length === 0) {
      break;
    }

    for (const event of events) {
      const original = JSON.stringify(event.form);
      const migrated = migrateFormWireKeys(original);

      if (migrated !== original) {
        await tx.event.update({
          where: { id: event.id },
          data: { form: JSON.parse(migrated) as Record<string, unknown> },
        });
      }
    }

    cursor = events[events.length - 1]?.id;
    if (events.length < BATCH_SIZE) {
      break;
    }
  }
}

async function migrateMessageTemplates(
  tx: Prisma.TransactionClient,
): Promise<void> {
  let cursor: string | undefined;

  while (true) {
    const rows = await tx.messageTemplate.findMany({
      select: { id: true, subject: true, body: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const subject = migrateFormWireKeys(row.subject);
      const body = migrateFormWireKeys(row.body);

      if (subject !== row.subject || body !== row.body) {
        await tx.messageTemplate.update({
          where: { id: row.id },
          data: { subject, body },
        });
      }
    }

    cursor = rows[rows.length - 1]?.id;
    if (rows.length < BATCH_SIZE) {
      break;
    }
  }
}

async function migrateMessages(tx: Prisma.TransactionClient): Promise<void> {
  let cursor: string | undefined;

  while (true) {
    const rows = await tx.message.findMany({
      select: { id: true, subject: true, body: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const subject = migrateFormWireKeys(row.subject);
      const body = migrateFormWireKeys(row.body);

      if (subject !== row.subject || body !== row.body) {
        await tx.message.update({
          where: { id: row.id },
          data: { subject, body },
        });
      }
    }

    cursor = rows[rows.length - 1]?.id;
    if (rows.length < BATCH_SIZE) {
      break;
    }
  }
}

async function migratePrivacyNoticeVersions(
  tx: Prisma.TransactionClient,
): Promise<void> {
  let cursor: string | undefined;

  while (true) {
    const versions = await tx.privacyNoticeVersion.findMany({
      select: { id: true, content: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (versions.length === 0) {
      break;
    }

    for (const version of versions) {
      const original = JSON.stringify(version.content);
      const migrated = migratePrivacyWireKeys(original);

      if (migrated !== original) {
        await tx.privacyNoticeVersion.update({
          where: { id: version.id },
          data: { content: JSON.parse(migrated) as Prisma.InputJsonValue },
        });
      }
    }

    cursor = versions[versions.length - 1]?.id;
    if (versions.length < BATCH_SIZE) {
      break;
    }
  }
}

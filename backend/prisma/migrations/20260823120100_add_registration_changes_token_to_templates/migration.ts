import type { Prisma } from '#generated/prisma/client.js';

/**
 * The `registration_updated` mail now offers a `{{ registration.changes }}`
 * token that lists the fields the edit touched. New events get it from the
 * preset, but templates created before it existed have no way to pick it up,
 * and the mail they send still says "please review the changes" without naming
 * any.
 *
 * The token is appended rather than injected at send time on purpose: a manager
 * who does not want the list can delete the chip in the editor, and that choice
 * sticks. A runtime fallback would have no way to tell "never wanted" from
 * "never had it".
 */

const EVENT = 'registration_updated';
const TOKEN = '{{ registration.changes }}';

// Matches the token however Handlebars whitespace happens to be written.
const TOKEN_PATTERN = /\{\{\s*registration\.changes\s*}}/;

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const templates = await tx.messageTemplate.findMany({
    where: { trigger: EVENT },
    select: { id: true, body: true },
  });

  for (const template of templates) {
    if (TOKEN_PATTERN.test(template.body)) {
      continue;
    }

    await tx.messageTemplate.update({
      where: { id: template.id },
      data: { body: `${template.body}<p>${TOKEN}</p>` },
    });
  }
}

import type { Prisma } from '#generated/prisma/client.js';

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const templates = await tx.messageTemplate.findMany({
    where: { country: null },
    include: {
      camp: true,
      messages: {
        include: { registration: true },
      },
      attachments: true,
    },
  });

  for (const template of templates) {
    const countries = template.camp.countries;

    // Create one template per country
    for (const country of countries) {
      // Since the type was changed from JSON to TEXT, we need to attempt to parse it manually
      const subject = getTranslations(parseObject(template.subject), country);
      const body = getTranslations(parseObject(template.body), country);

      if (!subject || !body) {
        if (!!subject || !!body) {
          throw new Error('Missing translations for country ' + country);
        }
        continue;
      }

      const newTemplate = await tx.messageTemplate.create({
        data: {
          country,
          subject,
          body,
          event: template.event,
          priority: template.priority,
          replyTo: template.replyTo,
          camp: { connect: { id: template.campId } },
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      });

      // Assign messages to the correct template
      for (const message of template.messages) {
        if (message.registration?.country !== country && countries.length > 1) {
          continue;
        }

        await tx.message.update({
          where: { id: message.id },
          data: { templateId: newTemplate.id },
        });
      }
    }

    if (template.attachments.length > 0) {
      throw new Error('Attachments are not supported yet');
    }
  }

  // Delete the old templates
  await tx.messageTemplate.deleteMany({
    where: { id: { in: templates.map((t) => t.id) } },
  });
}

function parseObject(str: string): string | Record<string, string> {
  try {
    return JSON.parse(str) as string | Record<string, string>;
  } catch {
    return str;
  }
}

function getTranslations(
  obj: string | Record<string, string>,
  country: string,
): string | undefined {
  if (typeof obj === 'string') {
    return obj;
  }

  return obj[country];
}

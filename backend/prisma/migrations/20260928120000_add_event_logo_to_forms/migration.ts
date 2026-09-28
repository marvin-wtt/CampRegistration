import type { Prisma } from '#generated/prisma/client.js';

/**
 * The form header shows the event logo only through `logo: '{event.logo}'`,
 * which new presets include. Add it to existing forms that have no logo of
 * their own; the logo property is hidden in the editor, so directors can't.
 */
const EVENT_LOGO_PLACEHOLDER = '{event.logo}';

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const events = await tx.event.findMany({ select: { id: true, form: true } });

  for (const event of events) {
    const form = event.form;
    if (!form || typeof form !== 'object' || Array.isArray(form)) {
      continue;
    }
    if ('logo' in form && form.logo) {
      continue;
    }

    await tx.event.update({
      where: { id: event.id },
      data: { form: { ...form, logo: EVENT_LOGO_PLACEHOLDER } },
    });
  }
}

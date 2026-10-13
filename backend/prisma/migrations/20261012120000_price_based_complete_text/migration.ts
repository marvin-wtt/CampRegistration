import type { Prisma } from '#generated/prisma/client.js';

/**
 * The Complete button now defaults to a label that follows the event's price
 * ("Kostenpflichtig anmelden" / "Verbindlich anmelden"). Presets used to write
 * a fixed text into every form, which would override that default — the camp
 * one even said "for a fee" on free events. Remove it where the form still
 * carries a preset text unchanged; a text a director edited stays.
 */
const PRESET_COMPLETE_TEXTS: Record<string, string>[] = [
  {
    en: 'Register for a fee',
    de: 'Kostenpflichtig Anmelden',
    fr: 'Inscription payante',
    pl: 'Zarejestruj się (płatne)',
    cs: 'Zaregistrovat se (placeně)',
    default: 'Register for a fee',
  },
  {
    en: 'Complete Registration',
    de: 'Anmeldung abschließen',
    fr: "Finaliser l'inscription",
    pl: 'Zakończ rejestrację',
    cs: 'Dokončit registraci',
    default: 'Complete Registration',
  },
];

function isPresetText(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value);

  return PRESET_COMPLETE_TEXTS.some(
    (preset) =>
      entries.length === Object.keys(preset).length &&
      entries.every(([locale, text]) => preset[locale] === text),
  );
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const events = await tx.event.findMany({ select: { id: true, form: true } });

  for (const event of events) {
    const form = event.form;
    if (!form || typeof form !== 'object' || Array.isArray(form)) {
      continue;
    }
    if (!('completeText' in form) || !isPresetText(form.completeText)) {
      continue;
    }

    const { completeText: _, ...rest } = form;
    await tx.event.update({
      where: { id: event.id },
      data: { form: rest },
    });
  }
}

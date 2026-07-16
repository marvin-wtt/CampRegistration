import type { Prisma } from '#generated/prisma/client.js';

/**
 * The `standard` and `minimal` camp form presets used to seed every new
 * camp's `form.completedHtml` with a hardcoded "Thank you for your
 * registration! ..." message. That's been replaced by a default generated
 * on the frontend (see `RegistrationForm.vue`) with call-to-action buttons —
 * but the frontend only generates it when `completedHtml` is absent, so
 * existing camps that still carry the untouched preset text won't pick it
 * up. Clear `completedHtml` for camps whose value still matches that old
 * preset text, leaving any camp-specific customization untouched.
 */

// Signature of the old preset default. The `standard` and `minimal` presets
// were identical except for a since-fixed typo in the German text, so both
// variants are listed and matched via a full deep-equal below.
const OLD_STANDARD_COMPLETED_HTML = {
  en: '<h3>Thank you for your registration!</h3><p style="font-size: 18px">You should receive a confirmation email shortly.</p>',
  de: '<h3>Vielen Dank für deine Anmeldung!</h3><p style="font-size: 18px">Du solltest in kurze eine Bestätigungsmail erhalten.</p>',
  fr: '<h3>Merci de t\'inscrire!</h3><p style="font-size: 18px">Tu devrais recevoir un e-mail de confirmation dans les plus brefs délais.</p>',
  pl: '<h3>Dziękujemy za rejestrację!</h3><p style="font-size: 18px">Wkrótce powinieneś/powinnaś otrzymać e-mail z potwierdzeniem.</p>',
  cs: '<h3>Děkujeme za registraci!</h3><p style="font-size: 18px">Brzy by ti měl přijít potvrzovací e-mail.</p>',
  default:
    '<h3>Thank you for your registration!</h3><p style="font-size: 18px">You should receive a confirmation email shortly.</p>',
};

const OLD_MINIMAL_COMPLETED_HTML = {
  ...OLD_STANDARD_COMPLETED_HTML,
  de: '<h3>Vielen Dank für deine Anmeldung!</h3><p style="font-size: 18px">Du solltest in Kürze eine Bestätigungsmail erhalten.</p>',
};

interface CampForm {
  completedHtml?: unknown;
  [key: string]: unknown;
}

function isSameCompletedHtml(
  value: unknown,
  expected: Record<string, string>,
): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const actual = value as Record<string, unknown>;
  const expectedKeys = Object.keys(expected);

  return (
    expectedKeys.length === Object.keys(actual).length &&
    expectedKeys.every((key) => actual[key] === expected[key])
  );
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const camps = await tx.camp.findMany({
    select: { id: true, form: true },
  });

  for (const camp of camps) {
    const form = camp.form as CampForm | null;
    if (!form || typeof form !== 'object') {
      continue;
    }

    const completedHtml = form.completedHtml;
    const isOldPresetDefault =
      isSameCompletedHtml(completedHtml, OLD_STANDARD_COMPLETED_HTML) ||
      isSameCompletedHtml(completedHtml, OLD_MINIMAL_COMPLETED_HTML);

    if (!isOldPresetDefault) {
      continue;
    }

    const { completedHtml: _removed, ...rest } = form;

    await tx.camp.update({
      where: { id: camp.id },
      data: { form: rest },
    });
  }
}

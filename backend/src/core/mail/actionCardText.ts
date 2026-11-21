import type { Translator } from '#core/mail/mail.types';
import type { ActionCardProps, LocalContext } from '#views/emails/types';

/**
 * The `text.title`/`text.information`/`text.button`/`preview`/`footer.cause`
 * keys every action-card email's translation namespace defines under its own
 * `getTranslationOptions()` keyPrefix — resolved identically by ~9 mailables,
 * so centralized here instead of repeated per mailable. `url` isn't included:
 * each mailable builds it from different domain data (event id, registration id, …).
 */
export type ActionCardText = Omit<LocalContext<ActionCardProps>, 'url'>;

export function resolveActionCardText(
  t: Translator,
  informationVars?: Record<string, unknown>,
): ActionCardText {
  return {
    preview: t('preview', informationVars),
    title: t('text.title', informationVars),
    information: t('text.information', informationVars),
    button: t('text.button'),
    reason: t('footer.cause'),
  };
}

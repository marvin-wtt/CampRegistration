import config from '#config/index';
import type { Translator } from '#core/mail/mail.types';
import type { ActionCardProps, LocalContext } from '#views/emails/types';

/**
 * The `text.title`/`text.information`/`text.button`/`text.greeting`/
 * `text.teamName`/`preview`/`footer.cause` keys every action-card email's
 * translation namespace defines under its own `getTranslationOptions()`
 * keyPrefix — resolved identically by ~9 mailables, so centralized here
 * instead of repeated per mailable. `url` isn't included: each mailable
 * builds it from different domain data (event id, registration id, …).
 */
export type ActionCardText = Omit<LocalContext<ActionCardProps>, 'url'>;

export function resolveActionCardText(
  t: Translator,
  informationVars?: Record<string, unknown>,
): ActionCardText {
  return {
    preview: t('preview', informationVars),
    title: t('text.title'),
    information: t('text.information', informationVars),
    button: t('text.button'),
    greeting: t('text.greeting'),
    teamName: t('text.teamName', { appName: config.appName }),
    reason: t('footer.cause'),
  };
}

import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';
import { Quasar } from 'quasar';

import { messages, datetimeFormats, numberFormats } from 'src/i18n';

export default defineBoot(({ app }) => {
  const i18n = createI18n({
    legacy: false,
    locale: getLocale(),
    fallbackLocale: 'en-US',
    globalInjection: true,
    messages,
    datetimeFormats,
    numberFormats,
    fallbackWarn: true,
    missingWarn: true,
  });

  // Set i18n instance on app
  app.use(i18n);
});

function getLocale(): string {
  const locale = Quasar.lang.getLocale()?.toLocaleLowerCase() || 'en-US';

  if (locale.startsWith('en')) {
    return 'en-US';
  }

  if (locale.startsWith('de')) {
    return 'de-DE';
  }

  if (locale.startsWith('fr')) {
    return 'fr-FR';
  }

  return 'en-US';
}

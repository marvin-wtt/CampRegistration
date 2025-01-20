import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';
import { Quasar } from 'quasar';

import { messages, datetimeFormats, numberFormats } from 'src/i18n';

export default defineBoot(({ app }) => {
  const i18n = createI18n({
    legacy: false,
    locale: Quasar.lang.getLocale() ?? 'en',
    fallbackLocale: 'en',
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

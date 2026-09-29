import { defineBoot } from '#q-app';
import { createI18n } from 'vue-i18n';
import { Quasar } from 'quasar';

import { messages, datetimeFormats, numberFormats } from '@/i18n';
import { setApiLocale } from '@/services/api';
import { watch } from 'vue';

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

  setApiLocale(i18n.global.locale.value);
  watch(i18n.global.locale, setApiLocale);
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

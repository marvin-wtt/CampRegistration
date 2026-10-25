import { defineBoot } from '#q-app';
import { createI18n } from 'vue-i18n';
import { Quasar } from 'quasar';

import { messages, datetimeFormats, numberFormats } from '@/i18n';
import { setApiLocale } from '@/services/api';
import { appLocaleFor } from '@/utils/appLocale';
import { watch } from 'vue';

export default defineBoot(({ app }) => {
  const i18n = createI18n({
    legacy: false,
    locale: appLocaleFor(Quasar.lang.getLocale()),
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

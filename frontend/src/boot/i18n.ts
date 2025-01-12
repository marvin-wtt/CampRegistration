import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import { Quasar } from 'quasar';

import messages from 'src/i18n';

export default boot(({ app }) => {
  const i18n = createI18n({
    legacy: false,
    locale: Quasar.lang.getLocale(),
    fallbackLocale: 'en',
    globalInjection: true,
    messages,
    fallbackWarn: true,
    missingWarn: true,
  });

  // Set i18n instance on app
  app.use(i18n);
});

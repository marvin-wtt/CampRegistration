import { defineBoot } from '#q-app/wrappers';
import { Quasar, type QuasarLanguage } from 'quasar';
import { watch } from 'vue';
import type { QSsrContext } from '#q-app';

const modules = import.meta.glob('../../../node_modules/quasar/lang/*.js');

function getModule(lang: string | undefined) {
  if (!lang) {
    return undefined;
  }

  return modules[`../../../node_modules/quasar/lang/${lang}.js`];
}

function updateLang(lang: string, ssrContext?: QSsrContext | undefined | null) {
  const module = getModule(lang) ?? getModule(lang.split('-')[0]);

  if (!module) {
    return;
  }

  module().then((lang) => {
    if (!lang || typeof lang !== 'object' || !('default' in lang)) {
      return;
    }

    Quasar.lang.set(lang?.default as unknown as QuasarLanguage, ssrContext);
  });
}

export default defineBoot(({ app, ssrContext }) => {
  updateLang(app.config.globalProperties.$i18n.locale, ssrContext);

  watch(
    () => app.config.globalProperties.$i18n.locale,
    (lang) => updateLang(lang),
  );
});

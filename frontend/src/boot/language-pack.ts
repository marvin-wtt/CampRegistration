import { defineBoot } from '#q-app/wrappers';
import { Quasar, type QuasarLanguage } from 'quasar';
import { watch } from 'vue';

const modules = import.meta.glob('../../../node_modules/quasar/lang/*.js');

function getModule(lang: string | undefined) {
  if (!lang) {
    return undefined;
  }

  return modules[`../../../node_modules/quasar/lang/${lang}.js`];
}

function updateLang(lang: string) {
  const module = getModule(lang) ?? getModule(lang.split('-')[0]);

  if (!module) {
    return;
  }

  module().then((lang) => {
    if (!lang || typeof lang !== 'object' || !('default' in lang)) {
      return;
    }

    Quasar.lang.set(lang?.default as unknown as QuasarLanguage);
  });
}

export default defineBoot(({ app }) => {
  updateLang(app.config.globalProperties.$i18n.locale);

  watch(() => app.config.globalProperties.$i18n.locale, updateLang);
});

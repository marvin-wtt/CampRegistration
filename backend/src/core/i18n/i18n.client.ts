import i18next from 'i18next';
import resources from '#i18n';

export const initI18n = async () => {
  await i18next.init({
    resources,
    debug: false,
    fallbackLng: 'en',
    // Translated strings are ultimately rendered by something that escapes at
    // its own HTML-serialization boundary — Vue's SSR renderer for emails,
    // `#utils/pageMeta`'s own `escapeHtml` for Open Graph tags. Escaping here
    // too would double-escape (`&` -> `&amp;` -> `&amp;amp;`); leave it to the
    // single point that actually knows it's producing HTML.
    interpolation: {
      escapeValue: false,
    },
  });

  await i18next.changeLanguage('en');
};

export const t = i18next.t;

export default i18next;

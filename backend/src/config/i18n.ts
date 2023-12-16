import i18next from 'i18next';
import resources from 'i18n';

export const initI18n = async () => {
  await i18next.init({
    resources,
    debug: false,
    fallbackLng: 'en',
  });

  await i18next.changeLanguage('en');
};

export const t = i18next.t;

export default i18next;

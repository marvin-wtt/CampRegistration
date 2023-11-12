import i18next from "i18next";
import resources from "@/i18n";

const locales = ["en", "de", "fr"];

export const initI18n = async () => {
  await i18next.init({
    resources,
    debug: true,
    // supportedLngs: locales,
    // preload: locales,
    fallbackLng: "en",
  });

  await i18next.changeLanguage("en");
  console.log(i18next.t("app-name"));
};

export default i18next;

import i18next from "i18next";
import resources from "@/i18n";

export const initI18n = async () => {
  await i18next.init({
    resources,
    debug: false,
    fallbackLng: "en",
  });

  await i18next.changeLanguage("en");
  console.log(i18next.t("app-name"));
};

export default i18next;

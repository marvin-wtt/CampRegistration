import { type ICustomQuestionTypeConfiguration, Serializer } from 'survey-core';
import {
  applyGroupCountry,
  countryChoices,
  groupCountryMatchProperty,
  showGroupCountryWarning,
} from './groupCountryMatch.js';
import type { Localized } from '../../locales.js';

const country: ICustomQuestionTypeConfiguration = {
  name: 'country',
  title: 'Country',
  questionJSON: {
    type: 'dropdown',
    autocomplete: 'country',
    placeholder: {
      de: 'Ein Land auswählen...',
      en: 'Select a country...',
      fr: 'Sélectionnez un pays...',
      pl: 'Wybierz kraj...',
      cs: 'Vyberte zemi...',
    } satisfies Localized,
    // Residence abroad must be answerable; the event's countries are moved to
    // the top once known (see `applyGroupCountry`).
    choices: countryChoices(),
  },
  onInit() {
    Serializer.addProperty('country', groupCountryMatchProperty);
  },
  onLoaded(question) {
    applyGroupCountry(question);
  },
  onValueChanged(question) {
    showGroupCountryWarning(question);
  },
};

export default country;

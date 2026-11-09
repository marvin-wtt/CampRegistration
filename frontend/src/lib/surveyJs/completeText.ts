import {
  surveyLocalization,
  type LocalizableString,
  type SurveyModel,
} from 'survey-core';
import type { AppLocale } from '@camp-registration/common/locales';

const PAID_KEY = 'registrationCompletePaid';
const FREE_KEY = 'registrationCompleteFree';

const COMPLETE_TEXTS: Record<AppLocale, { paid: string; free: string }> = {
  en: {
    paid: 'Register with obligation to pay',
    free: 'Submit binding registration',
  },
  de: {
    paid: 'Kostenpflichtig anmelden',
    free: 'Verbindlich anmelden',
  },
  fr: {
    paid: "S'inscrire avec obligation de paiement",
    free: "S'inscrire définitivement",
  },
  pl: {
    paid: 'Zarejestruj się z obowiązkiem zapłaty',
    free: 'Zarejestruj się wiążąco',
  },
  cs: {
    paid: 'Zaregistrovat se se závazkem k platbě',
    free: 'Závazně se zaregistrovat',
  },
};

// On every apply rather than at import: a survey-core locale bundle loaded
// later replaces its locale's strings object, dropping anything set before.
function registerStrings(): void {
  for (const [code, texts] of Object.entries(COMPLETE_TEXTS)) {
    const strings = surveyLocalization.locales[code];
    if (strings && strings[PAID_KEY] === undefined) {
      strings[PAID_KEY] = texts.paid;
      strings[FREE_KEY] = texts.free;
    }
  }
}

/**
 * Defaults the Complete button to a label that says whether registering costs
 * money — a paid registration's button has to (the German "button solution",
 * § 312j BGB). It is only the fallback: a `completeText` set in the form
 * editor wins, and the default is never written into the form JSON. Safe to
 * call again as the amount changes.
 */
export function setCompleteTextDefault(
  survey: SurveyModel,
  paid: boolean,
): void {
  registerStrings();
  completeText(survey).localizationName = paid ? PAID_KEY : FREE_KEY;
}

/** Whether the Complete button shows the default, not the form's own text. */
export function usesCompleteTextDefault(survey: SurveyModel): boolean {
  return completeText(survey).isEmpty;
}

// Created on first access (unlike `getLocalizableString`, which only finds it
// afterwards); survey-core defines it at runtime but leaves it untyped.
function completeText(survey: SurveyModel): LocalizableString {
  return (survey as unknown as { locCompleteText: LocalizableString })
    .locCompleteText;
}

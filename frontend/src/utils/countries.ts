import { COUNTRY_CODES } from '@camp-registration/common/utils';

// Distinct from `CountrySelect`, which offers only the handful of countries
// an event can be run in; an organization may be registered anywhere.
export { countryName } from '@camp-registration/common/utils';

export interface CountryOption {
  label: string;
  value: string;
}

export function countryOptions(locale: string): CountryOption[] {
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });

  return COUNTRY_CODES.map((code) => ({
    value: code,
    // Falls back to the upper-case code for regions the runtime doesn't know.
    label: displayNames.of(code.toUpperCase()) ?? code.toUpperCase(),
  })).sort((a, b) => a.label.localeCompare(b.label, locale));
}

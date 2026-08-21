import {
  getCountryData,
  type TCountryCode,
  type TLanguageCode,
} from 'countries-list';

export function countriesToLocales(countries: string[]): TLanguageCode[] {
  return countries
    .map((code): TCountryCode => code.toUpperCase() as TCountryCode)
    .map(getCountryData)
    .flatMap((country) => country.languages);
}

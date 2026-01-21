import { getCountryData, type TCountryCode } from 'countries-list';

export function countriesToLocales(countries: string[]): string[] {
  return countries
    .map((code): TCountryCode => code.toUpperCase() as TCountryCode)
    .map(getCountryData)
    .flatMap((country) => country.languages);
}

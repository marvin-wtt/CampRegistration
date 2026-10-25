import parsePhoneNumber, {
  type CountryCode,
  isSupportedCountry,
} from 'libphonenumber-js';

/**
 * Formats a phone number, or a comma- or semicolon-separated list of them, in
 * international notation. A number without a calling code is read in the
 * address country, else in the event's country if it has only one. What does
 * not parse stays as entered.
 */
export function formatPhoneNumber(
  value: string,
  countries: { country?: string | null | undefined; eventCountries: string[] },
): string {
  const { eventCountries } = countries;
  const country = (
    countries.country ??
    (eventCountries.length === 1 ? eventCountries[0] : undefined)
  )?.toUpperCase();

  const countryCode: CountryCode | undefined =
    country && isSupportedCountry(country) ? country : undefined;

  return value
    .split(/[,;]+/g)
    .map(
      (number) =>
        parsePhoneNumber(number.trim(), countryCode)?.formatInternational() ??
        number,
    )
    .join(', ');
}

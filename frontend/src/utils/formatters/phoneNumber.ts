export function formatPhoneNumber(
  phoneNumber: string,
  country?: string,
): string {
  if (
    !phoneNumber.match(/^([+0])\d[\d\-/\s]+$/g) ||
    (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('0'))
  ) {
    return phoneNumber;
  }

  // Replace all special characters
  phoneNumber = phoneNumber.replace(/\s|-|\//g, '');

  if (phoneNumber.startsWith('+')) {
    return formatForCountry(
      phoneNumber.substring(3),
      phoneNumber.substring(1, 3),
    );
  }

  if (phoneNumber.startsWith('00')) {
    return formatForCountry(
      phoneNumber.substring(4),
      phoneNumber.substring(2, 4),
    );
  }

  return formatForCountry(phoneNumber.substring(1), guessCountryCode(country));
}

function formatForCountry(
  phoneNumber: string,
  countryCode: string | undefined,
): string {
  let start = '';
  let end = phoneNumber;

  // First digit separate
  if (countryCode === '33') {
    start = phoneNumber.charAt(0);
    end = phoneNumber.substring(1);
  }

  // First three digits separate
  if (countryCode === '49') {
    start = phoneNumber.substring(0, 3);
    end = phoneNumber.substring(3);
  }

  // Split in chunks of two digits and join seperated by a single space
  const chunks = end.match(/.{1,2}/g) || [];
  end = chunks.join(' ');

  return countryCode ? `+${countryCode} ${start} ${end}` : `${start} ${end}`;
}

const countryCodes = {
  de: 49,
  fr: 33,
  pl: 48,
};

function guessCountryCode(country?: string): string | undefined {
  country = country?.toLowerCase();
  if (!country || !(country in countryCodes)) {
    return undefined;
  }

  return countryCodes[country as keyof typeof countryCodes].toString();
}

import passwordComplexity from 'joi-password-complexity';
import { CustomValidator } from 'joi';
import { getCountryData, TCountryCode } from 'countries-list';

export const PasswordSchema = passwordComplexity({
  min: 8,
  max: 26,
  lowerCase: 1,
  upperCase: 1,
  symbol: 1,
  numeric: 1,
  requirementCount: 3,
});

export const CountryCode: CustomValidator<string> = (value, helpers) => {
  const countryData = getCountryData(value.toUpperCase() as TCountryCode);

  if (!countryData) {
    return helpers.message({
      custom: 'Invalid country code',
    });
  }

  return value;
};

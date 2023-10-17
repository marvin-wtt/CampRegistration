import passwordComplexity from "joi-password-complexity";

export const PasswordSchema = passwordComplexity({
  min: 8,
  max: 26,
  lowerCase: 1,
  upperCase: 1,
  symbol: 1,
  numeric: 1,
  requirementCount: 3,
});

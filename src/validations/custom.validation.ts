import passwordComplexity from "joi-password-complexity";

export const PasswordSchema =  passwordComplexity({
  min: 8,
  symbol: 1,
  numeric: 1,
});

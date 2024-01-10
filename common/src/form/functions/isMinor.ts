const isMinor = (params: unknown[]) => {
  if (params.length < 1 || params[0] === null) {
    return null;
  }

  if (typeof params[0] !== 'string') {
    return null;
  }
  if (typeof params[1] !== 'string' && !(params[1] instanceof Date)) {
    return null;
  }

  const birthdate = new Date(params[0]);
  const date = new Date(params[1]);

  if (isNaN(birthdate.getTime()) || isNaN(date.getTime())) {
    return null;
  }

  const ageInMillis = date.getTime() - birthdate.getTime();
  const ageInYears = ageInMillis / (1000 * 60 * 60 * 24 * 365.25); // Taking leap years into account
  return ageInYears < 18;
};

export default isMinor;

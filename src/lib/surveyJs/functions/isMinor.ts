
const isMinor = (params: any[]) => {
  if (params.length !== 2) {
    return true;
  }

  const birthdate = new Date(params[0]);
  const date = new Date(params[1]);

  if (isNaN(birthdate.getTime()) || isNaN(date.getTime())) {
    throw new Error('Invalid date format in the array.');
  }

  const ageInMillis = date.getTime() - birthdate.getTime();
  const ageInYears = ageInMillis / (1000 * 60 * 60 * 24 * 365.25); // Taking leap years into account
  return ageInYears < 18;
};

export default isMinor;

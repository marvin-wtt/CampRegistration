const subtractYears = (params: unknown[]): Date | null => {
  if (params.length !== 2) {
    return null;
  }

  let date = params[0];

  if (typeof date === 'string') {
    date = new Date(date);
  }

  const years = params[1];
  if (typeof years !== 'number') {
    return null;
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }

  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() - years);

  return newDate;
};

export default subtractYears;

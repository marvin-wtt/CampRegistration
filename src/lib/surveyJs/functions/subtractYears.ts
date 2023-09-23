
const subtractYears = (params: unknown[]): Date | string => {
  if (params.length !== 2) {
    return 'Error';
  }

  let date = params[0];

  if (typeof date === 'string') {
    date = new Date(date);
  }

  const years = params[1];
  if (typeof years !== 'number') {
    return 'Error';
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Error';
  }

  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() - years);

  return newDate;
}

export default subtractYears;

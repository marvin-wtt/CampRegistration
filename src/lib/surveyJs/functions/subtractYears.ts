
const subtractYears = (params: any[]): Date | string => {
  if (params.length !== 2) {
    return '';
  }

  let date = params[0];
  const years = params[1];

  if (typeof date === 'string') {
    date = new Date(date);
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() - years);

  return newDate;
}

export default subtractYears;

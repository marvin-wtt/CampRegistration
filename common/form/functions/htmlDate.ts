const htmlDate = (params: unknown[]) => {
  if (params.length !== 1) {
    return '';
  }

  let date = params[0];

  if (typeof date === 'string') {
    date = new Date(date);
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    // Do not throw an exception
    return '';
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default htmlDate;

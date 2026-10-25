import { toCalendarDate } from './calendarDate.js';

const htmlDate = (params: unknown[]) => {
  if (params.length !== 1) {
    return null;
  }

  const date = toCalendarDate(params[0]);
  if (!date) {
    return null;
  }

  const year = date.year.toString().padStart(4, '0');
  const month = date.month.toString().padStart(2, '0');
  const day = date.day.toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default htmlDate;

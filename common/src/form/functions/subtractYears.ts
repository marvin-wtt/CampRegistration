import htmlDate from './htmlDate.js';
import { toCalendarDate } from './calendarDate.js';

const subtractYears = (params: unknown[]): string | null => {
  if (params.length !== 2) {
    return null;
  }

  const years = params[1];
  if (typeof years !== 'number') {
    return null;
  }

  const date = toCalendarDate(params[0]);
  if (!date) {
    return null;
  }

  // A local date, as htmlDate reads it; 29.02. rolls over to 01.03.
  return htmlDate([new Date(date.year - years, date.month - 1, date.day)]);
};

export default subtractYears;

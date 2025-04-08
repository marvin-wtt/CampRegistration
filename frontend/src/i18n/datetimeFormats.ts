const format = {
  short: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
  long: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
  },
  dateTime: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  },
} as const;

export default {
  'en-US': format,
  en: format,
  'de-DE': format,
  de: format,
  'fr-FR': format,
  fr: format,
} as const;

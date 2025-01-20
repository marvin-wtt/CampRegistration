const format = {
  currency: {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  decimal: {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  percent: {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

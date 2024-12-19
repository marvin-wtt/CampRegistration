import { ReceiptListFileConfig } from './ExpenseExportOption';

export const receiptListConfigs: Record<string, ReceiptListFileConfig> = {
  de: {
    file: 'belegliste.xlsx',
    worksheet: 'Liste des justificatifs',
    categories: [
      'Fahrtkosten',
      'Basiskosten',
      'Projektkosten',
      'Sprachförderkosten',
      'Kosten für hybride Projekte',
    ],
    sections: [
      {
        name: 'eligibleExpenditures',
        startRow: 16,
        rowCount: 10,
      },
      {
        name: 'nonEligibleExpenditures',
        startRow: 27,
        rowCount: 6,
      },
      {
        name: 'income',
        startRow: 33,
        rowCount: 5,
      },
      {
        name: 'information',
        startRow: 42,
        rowCount: 1,
      },
    ],
  },
  fr: {
    file: 'liste-des-justificatifs.xlsx',
    worksheet: 'Liste des justificatifs',
    categories: [
      'Frais de voyage',
      'Frais de base',
      'Frais de projet',
      'Frais de soutien linguistique',
      'Frais pour projet hybride',
    ],
    sections: [
      {
        name: 'eligibleExpenditures',
        startRow: 16,
        rowCount: 9,
      },
      {
        name: 'nonEligibleExpenditures',
        startRow: 27,
        rowCount: 6,
      },
      {
        name: 'income',
        startRow: 34,
        rowCount: 5,
      },
      {
        name: 'information',
        startRow: 43,
        rowCount: 1,
      },
    ],
  },
};

import type {
  BudgetCategories,
  ReceiptListFileConfig,
} from './ReceiptListFileConfig.js';

type Locales = 'de' | 'fr';

const budgetCategories: Record<Locales, BudgetCategories> = {
  de: {
    nonEligibleExpenses: {
      notDirectlyProjectRelatedExpenses:
        'Nicht direkt projektbezogene Ausgaben',
      investmentCosts: 'Investitionskosten',
      personnelCosts:
        'Personalkosten (außer den in Anhang 3 der Richtlinien aufgeführten Kosten)',
      others: 'Weiteres',
    },
    eligibleExpenses: {
      travelCosts: 'Fahrtkosten',
      basicCosts: 'Basiskosten',
      projectCosts: 'Projektkosten',
      languageSupportCosts: 'Sprachförderkosten',
      hybridProjectCosts: 'Kosten für hybride Projekte',
    },
    income: {
      fgyoRequestedGrant: 'Beim DFJW beantragter Zuschuss',
      publicFundsYouthAssociationsPrivateOrganizations:
        'Öffentliche Mittel, Jugendverband, private Organisation oder Institution, Stiftung, Unternehmen',
      localOrganizationContributions: 'Beiträge der örtlichen Organisation',
      partnerOrganizationContributions: 'Beiträge der Partnerorganisation',
      privateInstitutions: 'Private Einrichtung',
      companies: 'Unternehmen',
      participationFees: 'Teilnahmegebühren',
      foundation: 'Stiftung',
      others: 'Weiteres',
    },
  },
  fr: {
    nonEligibleExpenses: {
      notDirectlyProjectRelatedExpenses:
        'Dépenses non liées directement au projet',
      investmentCosts: 'Dépenses d’investissement',
      personnelCosts: "Dépenses de personnel hors ceux de l'annexe 3",
      others: 'Autre',
    },
    eligibleExpenses: {
      travelCosts: 'Frais de voyage',
      basicCosts: 'Frais de base',
      projectCosts: 'Frais de projet',
      languageSupportCosts: 'Frais de soutien linguistique',
      hybridProjectCosts: 'Frais pour projet hybride',
    },
    income: {
      fgyoRequestedGrant: "Subvention demandée à l'OFAJ",
      publicFundsYouthAssociationsPrivateOrganizations:
        'Fonds public, association de jeunesse, organisation ou institution privée, fondation, entreprise',
      localOrganizationContributions: 'Contributions du porteur de projet',
      partnerOrganizationContributions: 'Contributions du partenaire',
      privateInstitutions: 'Structure privée',
      companies: 'Entreprise',
      participationFees: 'Contribution des participantes et participants',
      foundation: 'Fondation',
      others: 'Autre',
    },
  },
};

export const receiptListConfigs: Record<Locales, ReceiptListFileConfig> = {
  de: {
    file: 'belegliste.xlsx',
    worksheet: 'Liste des justificatifs',
    sections: {
      eligibleExpenses: {
        categories: budgetCategories.de.eligibleExpenses,
        startRow: 16,
        rowCount: 10,
      },
      nonEligibleExpenses: {
        categories: budgetCategories.de.nonEligibleExpenses,
        startRow: 27,
        rowCount: 6,
      },
      income: {
        categories: budgetCategories.de.income,
        startRow: 33,
        rowCount: 5,
      },
    },
  },
  fr: {
    file: 'liste-des-justificatifs.xlsx',
    worksheet: 'Liste des justificatifs',
    sections: {
      eligibleExpenses: {
        categories: budgetCategories.fr.eligibleExpenses,
        startRow: 16,
        rowCount: 9,
      },
      nonEligibleExpenses: {
        categories: budgetCategories.fr.nonEligibleExpenses,
        startRow: 27,
        rowCount: 6,
      },
      income: {
        categories: budgetCategories.fr.income,
        startRow: 34,
        rowCount: 5,
      },
    },
  },
};

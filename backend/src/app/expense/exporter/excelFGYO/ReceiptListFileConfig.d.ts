interface BudgetCategories {
  nonEligibleExpenses: {
    notDirectlyProjectRelatedExpenses: string;
    investmentCosts: string;
    personnelCosts: string;
    others: string;
  };
  eligibleExpenses: {
    travelCosts: string;
    basicCosts: string;
    projectCosts: string;
    languageSupportCosts: string;
    hybridProjectCosts: string;
  };
  income: {
    fgyoRequestedGrant: string;
    publicFundsYouthAssociationsPrivateOrganizations: string;
    localOrganizationContributions: string;
    partnerOrganizationContributions: string;
    privateInstitutions: string;
    companies: string;
    participationFees: string;
    foundation: string;
    others: string;
  };
}

interface Section<T extends Record<string, string>> {
  categories: T;
  startRow: number;
  rowCount: number;
}

export interface ReceiptListFileConfig {
  file: string;
  worksheet: string;
  sections: {
    eligibleExpenses: Section<BudgetCategories['eligibleExpenses']>;
    nonEligibleExpenses: Section<BudgetCategories['nonEligibleExpenses']>;
    income: Section<BudgetCategories['income']>;
  };
}

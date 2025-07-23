interface BudgetCategories {
  nonEligible: {
    notProjectRelatedExpenses: string;
    investmentCosts: string;
    personnelCosts: string;
    others: string;
  };
  eligible: {
    travelCosts: string;
    basicCosts: string;
    projectCosts: string;
    languageSupportCosts: string;
    hybridProjectCosts: string;
  };
  income: {
    fgyoRequestedGrant: string;
    publicFunds: string;
    localOrganization: string;
    partnerOrganization: string;
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
    eligibleExpenses: Section<BudgetCategories['eligible']>;
    nonEligibleExpenses: Section<BudgetCategories['nonEligible']>;
    income: Section<BudgetCategories['income']>;
  };
}

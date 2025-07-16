import { useCampDetailsStore } from 'stores/camp-details-store';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import type { QSelectOption } from 'quasar';

export interface ExpenseCategory {
  label: Record<string, string> | string;
  caption?: Record<string, string> | string;
  value: string;
}

export interface ExpenseOption extends QSelectOption<string> {
  caption?: string | undefined;
}

type ExpensePresets = Record<
  string,
  Record<
    'income' | 'expense',
    { label: Record<string, string> | string; value: string }[]
  >
>;

const presets: ExpensePresets = {
  default: {
    income: [],
    expense: [],
  },
  fgyo: {
    income: [
      {
        label: {
          de: 'Beim DFJW beantragter Zuschuss',
          en: 'Subsidy applied for at FGYO',
          fr: "Subvention demandée auprès du l'OFAL",
        },
        value: 'income.fgyo.subsidy',
      },
      {
        label: {
          de: 'Öffentliche Mittel',
          en: 'Public funds',
          fr: 'Fonds publics',
        },
        value: 'income.fgyo.public_funds',
      },
      {
        label: {
          de: 'Beiträge der örtlichen Organisation',
          en: 'Contributions from the local organization',
          fr: 'Contributions de l’organisation locale',
        },
        value: 'income.fgyo.local_organization',
      },
      {
        label: {
          de: 'Beiträge der Partnerorganisation',
          en: 'Contributions from the partner organization',
          fr: 'Contributions de l’organisation partenaire',
        },
        value: 'income.fgyo.partner_organization',
      },
      {
        label: {
          de: 'Private Einrichtung',
          en: 'Private institution',
          fr: 'Établissement privé',
        },
        value: 'income.fgyo.private_institution',
      },
      {
        label: {
          de: 'Unternehmen',
          en: 'Companies',
          fr: 'Entreprises',
        },
        value: 'income.fgyo.companies',
      },
      {
        label: {
          de: 'Teilnahmegebühren',
          en: 'Participation fees',
          fr: 'Frais de participation',
        },
        value: 'income.fgyo.participation_fees',
      },
      {
        label: {
          de: 'Stiftung',
          en: 'Foundation',
          fr: 'Fondation',
        },
        value: 'income.fgyo.foundation',
      },
      {
        label: {
          de: 'Weiteres',
          en: 'Other',
          fr: 'Autre',
        },
        value: 'income.fgyo.other',
      },
    ],
    expense: [
      {
        label: {
          de: 'Fahrtkoste',
          en: 'Travel costs',
          fr: 'Frais de déplacement',
        },
        value: 'expense.fgyo.travel_costs',
      },
      {
        label: {
          de: 'Basiskosten',
          en: 'Basic costs',
          fr: 'Frais de base',
        },
        value: 'expense.fgyo.basic_costs',
      },
      {
        label: {
          de: 'Projektkosten',
          en: 'Project costs',
          fr: 'Frais de projet',
        },
        value: 'expense.fgyo.project_costs',
      },
      {
        label: {
          de: 'Materialkosten',
          en: 'Material costs',
          fr: 'Frais de matériel',
        },
        value: 'expense.fgyo.material_costs',
      },
      {
        label: {
          de: 'Sprachförderkosten',
          en: 'Language support costs',
          fr: 'Frais de soutien linguistique',
        },
        value: 'expense.fgyo.language_support_costs',
      },
      {
        label: {
          de: 'Kosten für hybride Projekte',
          en: 'Costs for hybrid projects',
          fr: 'Frais pour les projets hybrides',
        },
        value: 'expense.fgyo.hybrid_project_costs',
      },
      {
        label: {
          de: 'Nicht direkt projektbezogene Ausgaben',
          en: 'Non-project related expenses',
          fr: 'Dépenses non liées au projet',
        },
        value: 'expense.fgyo.non_project_related_expenses',
      },
      {
        label: {
          de: 'Investitionskosten',
          en: 'Investment costs',
          fr: 'Frais d’investissement',
        },
        value: 'expense.fgyo.investment_costs',
      },
      {
        label: {
          de: 'Personalkosten',
          en: 'Personnel costs',
          fr: 'Frais de personnel',
        },
        value: 'expense.fgyo.personnel_costs',
      },
      {
        label: {
          de: 'Weiteres',
          en: 'Other',
          fr: 'Autre',
        },
        value: 'expense.fgyo.other',
      },
    ],
  },
};

export function useExpenseCategories() {
  const campDetailsStore = useCampDetailsStore();
  const { data: camp } = storeToRefs(campDetailsStore);
  const { t } = useI18n({
    useScope: 'local',
    messages: {},
  });

  const categories = computed<Record<'income' | 'expense', ExpenseOption[]>>(
    () => {
      if (!camp.value) {
        return {
          income: [],
          expense: [],
        };
      }

      const campType = camp.value.type ?? 'default';

      const categories = presets[campType] ?? presets.default!;

      // TODO Translate labels and captions

      return categories;
    },
  );

  const incomeCategories = computed<ExpenseOption[]>(() => {
    return categories.value.income;
  });

  const expenseCategories = computed<ExpenseOption[]>(() => {
    return categories.value.expense;
  });

  return {
    categories,
    incomeCategories,
    expenseCategories,
  };
}

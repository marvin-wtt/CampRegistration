import TableComponentRegistry from 'components/campManagement/table/ComponentRegistry';
import { computed, type Ref, ref, watch } from 'vue';
import { ExpressionEvaluator } from 'components/ExpressionEvaluator';
import { objectValueByPath } from 'src/utils/objectValueByPath';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { TableCellRenderer } from 'components/campManagement/table/TableCellRenderer';

import type { QTable } from 'quasar';
import type {
  CampDetails,
  Registration,
  TableTemplate,
  TableColumnTemplate,
} from '@camp-registration/common/entities';
import type {
  CTableTemplate,
  CTableColumnTemplate,
} from 'src/types/CTableTemplate';

type Pagination = Exclude<QTable['pagination'], undefined>;

export interface ResultTableModelInput {
  questions: Ref<TableColumnTemplate[]>;
  registrations: Ref<Registration[]>;
  templates: Ref<TableTemplate[]>;
  camp: Ref<CampDetails>;
}

export interface ResultTableModelOptions {
  initialTemplateId?: string | null;
}

export function useResultTableModel(
  input: ResultTableModelInput,
  options: ResultTableModelOptions = {},
) {
  const registrationAccessor = useRegistrationHelper();

  const pagination = ref<Pagination>({
    rowsPerPage: 0,
    sortBy: null,
  });

  const countryFilter = ref<string[] | undefined>([]);

  const countries = computed(() => input.camp.value.countries);

  const templateOptions = computed<CTableTemplate[]>(() => {
    const mapped: CTableTemplate[] = input.templates.value.map((template) => ({
      ...template,
      columns: template.columns.map((column) => ({
        ...column,
        field: (row: unknown) => objectValueByPath(column.field, row),
        fieldName: column.field,
      })),
    }));

    // Default template to show all information
    mapped.push({
      id: '-1',
      title: 'Original (Plain)',
      columns: input.questions.value.map((column) => ({
        ...column,
        field: (row: unknown) => objectValueByPath('data.' + column.field, row),
        fieldName: 'data.' + column.field,
      })),
      order: 99,
      generated: true,
    });

    return mapped.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  });

  function defaultTemplate(): CTableTemplate {
    const id = options.initialTemplateId ?? null;
    if (id) {
      const found = templateOptions.value.find((v) => v.id == id);
      if (found) {
        pagination.value.sortBy = found.sortBy ?? null;
        pagination.value.descending = found.sortDirection === 'desc';
        return found;
      }
    }

    if (templateOptions.value.length === 0) {
      throw new Error('No templates available');
    }
    return templateOptions.value[0]!;
  }

  const template = ref<CTableTemplate>(defaultTemplate());

  watch(template, (newValue) => {
    pagination.value.sortBy = newValue.sortBy ?? null;
    pagination.value.descending = newValue.sortDirection === 'desc';
  });

  const rows = computed<Registration[]>(() => {
    let r = [...input.registrations.value];

    // Preset filter
    if (template.value.filter !== undefined) {
      const ex = new ExpressionEvaluator(template.value.filter);
      r = r.filter((row) => ex.evaluate(row));
    }

    // Waiting list
    if (template.value.filterStatus !== undefined) {
      r = r.filter((row) => template.value.filterStatus?.includes(row.status));
    }

    // Role
    if (template.value.filterRoles) {
      r = r.filter((row) => {
        // If no role is set for a given registration, it is assumed that it is a participant registration
        const role = row.computedData.role ?? 'participant';

        return !template.value.filterRoles!.includes(role);
      });
    }

    // Country filter (interactive-only typically)
    if (Array.isArray(countryFilter.value) && countryFilter.value.length > 0) {
      r = r.filter((value) => {
        const country = registrationAccessor.country(value);
        return country && countryFilter.value?.includes(country);
      });
    }

    return r;
  });

  const columns = computed<CTableColumnTemplate[]>(() => {
    const cols = [...template.value.columns];

    // Add index column as first column
    if (template.value.indexed) {
      cols.unshift({
        name: '_index',
        field: '',
        fieldName: '',
        label: '',
        align: 'center',
        renderAs: 'index',
        shrink: true,
      });
    }

    // Add actions column at the end
    if (template.value.actions) {
      cols.push({
        name: '_action',
        align: 'center',
        label: '',
        field: '',
        fieldName: '',
        renderAs: 'action',
        shrink: true,
      });
    }

    return cols;
  });

  const renderers = computed(() => {
    const rendererMap = new Map<string, TableCellRenderer>();

    columns.value.forEach((column) => {
      column.renderAs ??= 'default';
      const componentEntry = TableComponentRegistry.load(column.renderAs);
      const renderComponent = componentEntry.component;

      if (renderComponent) {
        rendererMap.set(
          column.name,
          new TableCellRenderer(renderComponent, column),
        );
      }
    });

    return rendererMap;
  });

  return {
    pagination,
    templateOptions,
    template,
    rows,
    columns,
    renderers,
    countryFilter,
    countries,
  };
}

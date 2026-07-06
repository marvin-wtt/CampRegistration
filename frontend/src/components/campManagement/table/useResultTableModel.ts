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
import {
  buildLocalTableTemplates,
  type LocalTableTemplate,
} from 'components/campManagement/table/localTableTemplates';

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

function matchesSearch(value: unknown, search: string): boolean {
  if (value == null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.toLowerCase().includes(search);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase().includes(search);
  }
  if (Array.isArray(value)) {
    return value.some((entry) => matchesSearch(entry, search));
  }
  if (typeof value === 'object') {
    return Object.values(value).some((entry) => matchesSearch(entry, search));
  }

  return false;
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

  const searchFilter = ref<string | null>('');

  const countries = computed(() => input.camp.value.countries);

  function mapTemplate(
    template: TableTemplate | LocalTableTemplate,
  ): CTableTemplate {
    return {
      ...template,
      columns: template.columns.map((column) => ({
        ...column,
        field: (row: unknown) => objectValueByPath(column.field, row),
        fieldName: column.field,
      })),
    };
  }

  // Includes hidden, local templates so they stay resolvable by id (e.g. as a
  // dashboard route target) even though they are kept out of the picker below.
  const allTemplates = computed<CTableTemplate[]>(() => {
    const mapped: CTableTemplate[] = input.templates.value.map(mapTemplate);

    // Hidden, frontend-only templates used as deep-link targets.
    for (const local of buildLocalTableTemplates(
      registrationAccessor,
      input.camp.value,
    )) {
      mapped.push(mapTemplate(local));
    }

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

  const visibleTemplates = computed<CTableTemplate[]>(() =>
    allTemplates.value.filter((template) => !template.hidden),
  );

  function applyTemplateSort(template: CTableTemplate) {
    pagination.value.sortBy = template.sortBy ?? null;
    pagination.value.descending = template.sortDirection === 'desc';
  }

  function defaultTemplate(): CTableTemplate {
    const id = options.initialTemplateId ?? null;
    if (id) {
      // Resolve against all templates so hidden, local targets can be selected.
      const found = allTemplates.value.find((v) => v.id == id);
      if (found) {
        return found;
      }
    }

    if (visibleTemplates.value.length === 0) {
      throw new Error('No templates available');
    }
    return visibleTemplates.value[0]!;
  }

  const template = ref<CTableTemplate>(defaultTemplate());

  // The active template may be hidden (e.g. resolved from a dashboard deep
  // link); keep it in the select options so its label can still be rendered
  // instead of leaving the picker showing a blank selection.
  const templateOptions = computed<CTableTemplate[]>(() => {
    const visible = visibleTemplates.value;
    if (
      template.value.hidden &&
      !visible.some((t) => t.id === template.value.id)
    ) {
      return [...visible, template.value];
    }
    return visible;
  });

  // Apply the sort order of the initial template since the watcher below only
  // reacts to subsequent changes.
  applyTemplateSort(template.value);

  watch(template, (newValue) => {
    applyTemplateSort(newValue);
  });

  const rows = computed<Registration[]>(() => {
    let r = [...input.registrations.value];

    // Preset filter
    if (template.value.filter != null) {
      const ex = new ExpressionEvaluator(template.value.filter);
      r = r.filter((row) => ex.evaluate(row));
    }

    // Waiting list
    if (
      template.value.filterStatus !== undefined &&
      template.value.filterStatus.length > 0
    ) {
      r = r.filter((row) => template.value.filterStatus?.includes(row.status));
    }

    // Local (frontend-only) predicate, e.g. "missing contact details"
    if (template.value.localFilter) {
      const predicate = template.value.localFilter;
      r = r.filter((row) => predicate(row));
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

    // Free-text search across the values of the visible template columns
    const search = searchFilter.value?.trim().toLowerCase() ?? '';
    if (search.length > 0) {
      const fields = template.value.columns.map((column) => column.field);
      r = r.filter((row) =>
        fields.some((field) => {
          const value =
            typeof field === 'function'
              ? field(row)
              : objectValueByPath(field, row);
          return matchesSearch(value, search);
        }),
      );
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
    if (template.value.actions !== false) {
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
      // Custom (staff-entered) fields are meant to be editable text by
      // default, even if a column was ever persisted without an explicit
      // renderAs (e.g. via direct API use) — fall back to the editor rather
      // than the generic read-only default cell.
      column.renderAs ??= column.source === 'custom' ? 'editor' : 'default';
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
    searchFilter,
    countries,
  };
}

import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import {
  sortRows,
  useResultTableModel,
  type Pagination,
} from '@/components/event/table/useResultTableModel';
import { LOCAL_TEMPLATE_PENDING } from '@/components/event/table/localTableTemplates';
import type { CTableColumnTemplate } from '@/types/CTableTemplate';
import type {
  EventDetails,
  Registration,
  TableColumnTemplate,
  TableTemplate,
} from '@camp-registration/common/entities';

// The helper pulls in the event/registration stores; the template selection
// under test never calls into it.
vi.mock('@/composables/registrationHelper', () => ({
  useRegistrationHelper: () => ({}),
}));

function makePagination(overrides: Partial<Pagination> = {}): Pagination {
  return {
    sortBy: null,
    descending: false,
    rowsPerPage: 0,
    ...overrides,
  };
}

const nameColumn: CTableColumnTemplate = {
  name: 'name',
  label: 'Name',
  field: (row) => (row as Registration & { name: string }).name,
  fieldName: 'name',
};

const ageColumn: CTableColumnTemplate = {
  name: 'age',
  label: 'Age',
  field: (row) => (row as Registration & { age: number }).age,
  fieldName: 'age',
};

const rows = [
  { name: 'Charlie', age: 30 },
  { name: 'alice', age: 10 },
  { name: 'Bob', age: 20 },
] as unknown as Registration[];

describe('sortRows', () => {
  it('returns the rows unchanged when no column is sorted', () => {
    expect(sortRows(rows, [nameColumn], makePagination())).toEqual(rows);
  });

  it('returns the rows unchanged when sortBy references an unknown column', () => {
    expect(
      sortRows(rows, [nameColumn], makePagination({ sortBy: 'missing' })),
    ).toEqual(rows);
  });

  it('sorts ascending by a string column, case-insensitively', () => {
    const sorted = sortRows(
      rows,
      [nameColumn],
      makePagination({ sortBy: 'name' }),
    );

    expect(sorted.map((r) => (r as unknown as { name: string }).name)).toEqual([
      'alice',
      'Bob',
      'Charlie',
    ]);
  });

  it('sorts descending when pagination.descending is set', () => {
    const sorted = sortRows(
      rows,
      [nameColumn],
      makePagination({ sortBy: 'name', descending: true }),
    );

    expect(sorted.map((r) => (r as unknown as { name: string }).name)).toEqual([
      'Charlie',
      'Bob',
      'alice',
    ]);
  });

  it('sorts numerically for a numeric column instead of lexicographically', () => {
    const sorted = sortRows(
      rows,
      [ageColumn],
      makePagination({ sortBy: 'age' }),
    );

    expect(sorted.map((r) => (r as unknown as { age: number }).age)).toEqual([
      10, 20, 30,
    ]);
  });

  it('sorts null/undefined values first, ascending', () => {
    const withNull = [
      { name: 'Bob' },
      { name: null },
      { name: 'alice' },
    ] as unknown as Registration[];

    const sorted = sortRows(
      withNull,
      [nameColumn],
      makePagination({ sortBy: 'name' }),
    );

    expect(
      sorted.map((r) => (r as unknown as { name: string | null }).name),
    ).toEqual([null, 'alice', 'Bob']);
  });

  it('does not mutate the input array', () => {
    const copy = [...rows];
    sortRows(rows, [nameColumn], makePagination({ sortBy: 'name' }));

    expect(rows).toEqual(copy);
  });
});

describe('useResultTableModel template selection', () => {
  const storedTemplates = [
    { id: 'a', title: 'A', columns: [], order: 1 },
    { id: 'b', title: 'B', columns: [], order: 2, sortBy: 'name' },
  ] as unknown as TableTemplate[];

  // The model is only ever created with its data loaded (the table mounts
  // behind `ResultTableInteractive`'s skeleton until then).
  function setup(initialTemplateId: string | null = null) {
    const input = {
      questions: ref<TableColumnTemplate[]>([]),
      registrations: ref<Registration[]>([]),
      templates: ref<TableTemplate[]>(storedTemplates),
      event: ref({ countries: [] } as unknown as EventDetails),
    };
    const model = useResultTableModel(input, { initialTemplateId });

    return { input, model };
  }

  function select(model: ReturnType<typeof setup>['model'], id: string) {
    model.template.value = model.templateOptions.value.find(
      (t) => t.id === id,
    )!;
  }

  it('selects the first template by default', () => {
    expect(setup().model.template.value.id).toBe('a');
  });

  it('selects a deep-linked template, including a hidden local one', () => {
    expect(setup('b').model.template.value.id).toBe('b');
    expect(setup(LOCAL_TEMPLATE_PENDING).model.template.value.id).toBe(
      LOCAL_TEMPLATE_PENDING,
    );
  });

  it('falls back to the default for an unknown deep link', () => {
    expect(setup('missing').model.template.value.id).toBe('a');
  });

  it('keeps the default selection when a template is added before it', async () => {
    const { input, model } = setup();

    input.templates.value = [
      { id: 'c', title: 'C', columns: [], order: 0 },
      ...storedTemplates,
    ];
    await nextTick();

    expect(model.template.value.id).toBe('a');
  });

  it('keeps a picked template and resolves it to its updated instance', async () => {
    const { input, model } = setup();
    select(model, 'b');

    input.templates.value = storedTemplates.map((t) =>
      t.id === 'b' ? { ...t, title: 'B (renamed)' } : t,
    );
    await nextTick();

    expect(model.template.value.title).toBe('B (renamed)');
  });

  it('falls back to the default when the selected template is deleted', async () => {
    const { input, model } = setup('b');

    input.templates.value = storedTemplates.filter((t) => t.id !== 'b');
    await nextTick();

    expect(model.template.value.id).toBe('a');
  });

  it("applies a template's sort when it is selected", async () => {
    const { model } = setup();
    expect(model.pagination.value.sortBy).toBeNull();

    select(model, 'b');
    await nextTick();

    expect(model.pagination.value.sortBy).toBe('name');
  });

  it('keeps a column-header sort across unrelated template updates', async () => {
    const { input, model } = setup();
    model.pagination.value.sortBy = 'age';

    input.templates.value = storedTemplates.map((t) => ({ ...t }));
    await nextTick();

    expect(model.pagination.value.sortBy).toBe('age');
  });

  it("re-applies the sort when the active template's sort is edited", async () => {
    const { input, model } = setup();
    model.pagination.value.sortBy = 'age';

    input.templates.value = storedTemplates.map((t) =>
      t.id === 'a' ? { ...t, sortBy: 'name', sortDirection: 'desc' } : t,
    );
    await nextTick();

    expect(model.pagination.value).toMatchObject({
      sortBy: 'name',
      descending: true,
    });
  });
});

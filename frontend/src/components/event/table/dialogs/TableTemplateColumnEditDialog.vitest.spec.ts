import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Dialog, QDialog } from 'quasar';
import { DOMWrapper, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import type {
  EventDetails,
  Registration,
  TableColumnTemplate,
} from '@camp-registration/common/entities';
import TableTemplateColumnEditDialog from '@/components/event/table/dialogs/TableTemplateColumnEditDialog.vue';

installQuasarPlugin({
  components: { QDialog },
  plugins: { Dialog },
});

const event = {
  id: 'e1',
  locales: ['en'],
  form: {
    elements: [
      { type: 'text', name: 'first_name' },
      { type: 'radiogroup', name: 'leave', choices: ['alone', 'none'] },
    ],
  },
} as unknown as EventDetails;

async function open(
  column: Pick<TableColumnTemplate, 'field'> & Partial<TableColumnTemplate>,
  registrations?: Partial<Registration>[],
) {
  const wrapper = mount(TableTemplateColumnEditDialog, {
    props: {
      column: { name: 'col', label: 'Col', source: 'form', ...column },
      event,
      registrations: registrations as Registration[] | undefined,
    },
  });
  wrapper.findComponent(QDialog).vm.show();
  await nextTick();

  return wrapper;
}

const body = () => new DOMWrapper(document.body);
const warnings = (kind: 'field' | 'value') =>
  body()
    .findAll(`[data-test="column-${kind}-warning"]`)
    .map((warning) => warning.text());

describe('TableTemplateColumnEditDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('warns under the field input when the form lacks the field', async () => {
    const wrapper = await open({ field: 'data.last_name' });

    // Global messages aren't loaded in tests: `t` returns the key.
    expect(warnings('field')).toEqual(['warning tableTemplates.issue.field']);
    wrapper.unmount();
  });

  it('says when registrations still hold the removed field', async () => {
    const wrapper = await open({ field: 'data.last_name' }, [
      { data: { last_name: 'Doe' } },
    ]);

    expect(warnings('field')).toEqual([
      'warning tableTemplates.issue.fieldInUse',
    ]);
    wrapper.unmount();
  });

  it('warns about icon-mapped values no choice has', async () => {
    const wrapper = await open({
      field: 'data.leave',
      renderAs: 'icon_mapping',
      renderOptions: { mappings: [{ value: 'alone' }, { value: 'group' }] },
    });

    expect(warnings('field')).toEqual([]);
    expect(warnings('value')).toEqual(['warning tableTemplates.issue.value']);
    wrapper.unmount();
  });

  it('shows no warning for a field the form has', async () => {
    const wrapper = await open({ field: 'data.first_name' });

    expect(warnings('field')).toEqual([]);
    expect(warnings('value')).toEqual([]);
    wrapper.unmount();
  });
});

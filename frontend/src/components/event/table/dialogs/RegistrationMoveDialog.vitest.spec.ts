import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { describe, expect, it } from 'vitest';
import { Dialog, QDialog, QOptionGroup } from 'quasar';
import { DOMWrapper, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';
import RegistrationMoveDialog from '@/components/event/table/dialogs/RegistrationMoveDialog.vue';

installQuasarPlugin({
  components: { QDialog },
  plugins: { Dialog },
});

const event = {
  countries: ['de', 'fr', 'gb'],
  freePlaces: { de: 3, fr: 0, gb: 5 },
  maxParticipants: { de: 10, fr: 10, gb: 10 },
} as unknown as EventDetails;

const registration = {
  id: 'r1',
  group: 'de',
  computedData: { firstName: 'Ann', lastName: 'Lee' },
} as unknown as Registration;

async function createWrapper() {
  const wrapper = mount(RegistrationMoveDialog, {
    props: { registration, event },
  });
  wrapper.findComponent(QDialog).vm.show();
  await nextTick();

  return wrapper;
}

const submit = () =>
  new DOMWrapper(document.body).find('[data-test="registration-move-submit"]');

describe('RegistrationMoveDialog', () => {
  it('offers the other countries with their free places', async () => {
    const wrapper = await createWrapper();

    const options = wrapper.findComponent(QOptionGroup).props('options') as {
      value: string;
      caption: string | null;
    }[];

    expect(options.map((option) => option.value)).toEqual(['fr', 'gb']);
    // Component <i18n> blocks aren't loaded in tests: `t` returns the key.
    expect(options.map((option) => option.caption)).toEqual([
      'full',
      'placesLeft',
    ]);
  });

  it('moves to the chosen country once one is picked', async () => {
    const wrapper = await createWrapper();
    expect(submit().attributes('disabled')).toBeDefined();

    wrapper.findComponent(QOptionGroup).vm.$emit('update:modelValue', 'gb');
    await nextTick();
    await submit().trigger('click');

    expect(wrapper.emitted('ok')).toEqual([[{ group: 'gb' }]]);
  });
});

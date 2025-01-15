import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { describe, expect, it } from 'vitest';
import { Dialog, QDialog } from 'quasar';
import { DOMWrapper, mount, type VueWrapper } from '@vue/test-utils';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import { selector } from 'app/test/vitest/utils/element-selector';
import { nextTick } from 'vue';

installQuasarPlugin({
  components: { QDialog },
  plugins: { Dialog },
});

const showDialog = async (wrapper: VueWrapper) => {
  const dialog = wrapper.findComponent(QDialog);
  dialog.vm.show();
  await nextTick();
};

const createWrapper = () => {
  return mount(SafeDeleteDialog, {
    props: {
      title: 'Test title',
      message: 'Test message',
      value: 'Test value',
      label: 'test label',
    },
  });
};

const createBodyWrapper = async () => {
  const wrapper = createWrapper();
  await showDialog(wrapper);
  const bodyWrapper = new DOMWrapper(document.body);

  return {
    wrapper,
    bodyWrapper,
  };
};

describe('SafeDeleteDialog', () => {
  it('should mount', async () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBeTruthy();

    await showDialog(wrapper);

    const bodyWrapper = new DOMWrapper(document.body);

    // `.find()` won't error out even if the element is not found
    expect(bodyWrapper.find('.q-dialog').exists()).toBeTruthy();
  });

  it('should show all props', async () => {
    const { bodyWrapper } = await createBodyWrapper();

    const title = bodyWrapper.find(selector('title'));
    expect(title.exists()).toBeTruthy();
    expect(title.text()).toBe('Test title');

    const message = bodyWrapper.find(selector('message'));
    expect(message.exists()).toBeTruthy();
    expect(message.text()).toBe('Test message');

    const value = bodyWrapper.find(selector('value'));
    expect(value.exists()).toBeTruthy();
    expect(value.text()).toBe('Test value');
  });

  it('should submit when the input matches', async () => {
    const { wrapper, bodyWrapper } = await createBodyWrapper();

    const input = bodyWrapper.find(selector('input'));
    expect(input.exists()).toBeTruthy();
    await input.setValue('Test value');

    const btn = bodyWrapper.find(selector('submit'));
    await btn.trigger('click');

    expect(wrapper.emitted().ok).toBeDefined();
  });

  it('should disable the submit button when input does not match', async () => {
    const { wrapper, bodyWrapper } = await createBodyWrapper();

    const input = bodyWrapper.find(selector('input'));
    expect(input.exists()).toBeTruthy();
    await input.setValue('False value');

    const btn = bodyWrapper.find(selector('submit'));
    await btn.trigger('click');

    expect(wrapper.emitted().ok).toBeUndefined();
  });

  it('should cancel without submission', async () => {
    const { wrapper, bodyWrapper } = await createBodyWrapper();

    const btn = bodyWrapper.find(selector('cancel'));
    await btn.trigger('click');

    expect(wrapper.emitted().ok).toBeUndefined();
    expect(wrapper.emitted().cancel).toBeUndefined();
  });
});

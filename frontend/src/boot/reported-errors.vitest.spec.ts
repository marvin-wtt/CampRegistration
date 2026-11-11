import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { QBtn, QIcon, QPage } from 'quasar';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { installReportedErrorHandling } from '@/boot/reported-errors';
import { markReported } from '@/utils/reportedError';

installQuasarPlugin({ components: { QPage, QBtn, QIcon } });

vi.mock('vue-router', () => ({
  useRouter: () => ({ go: vi.fn() }),
  onBeforeRouteLeave: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

// A button whose click handler returns the failing save, like
// `@click="store.updateData(...)"` does.
function failingButton(error: unknown) {
  return defineComponent({
    setup: () => () =>
      h('button', {
        'data-test': 'save',
        onClick: () => Promise.reject(error),
      }),
  });
}

function mountPage(error: unknown) {
  return mount(PageStateHandler, {
    slots: { default: () => h(failingButton(error)) },
  });
}

describe('PageStateHandler', () => {
  it('keeps the page when a reported save fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mountPage(markReported(new Error('offline')));

    await wrapper.get('[data-test="save"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-test="page-error"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="save"]').exists()).toBe(true);
  });

  it('still shows the error screen for an unexpected error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wrapper = mountPage(new Error('bug'));

    await wrapper.get('[data-test="save"]').trigger('click');
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-test="page-error"]').exists()).toBe(true);
  });
});

describe('installReportedErrorHandling', () => {
  function setup() {
    const app = createApp({ render: () => null });
    const previous = vi.fn();
    app.config.errorHandler = previous;
    const target = new EventTarget() as unknown as Window;
    installReportedErrorHandling(app, target);
    return { app, previous, target };
  }

  function rejection(reason: unknown) {
    const event = new Event('unhandledrejection', { cancelable: true });
    Object.assign(event, { reason });
    return event;
  }

  it('silences reported errors in the Vue error handler', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { app, previous } = setup();

    app.config.errorHandler!(markReported(new Error('offline')), null, '');

    expect(previous).not.toHaveBeenCalled();
  });

  it('passes other errors on to the previous handler', () => {
    const { app, previous } = setup();
    const error = new Error('bug');

    app.config.errorHandler!(error, null, 'setup');

    expect(previous).toHaveBeenCalledWith(error, null, 'setup');
  });

  it('marks only reported rejections as handled', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { target } = setup();

    const reported = rejection(markReported(new Error('offline')));
    const unexpected = rejection(new Error('bug'));
    target.dispatchEvent(reported);
    target.dispatchEvent(unexpected);

    expect(reported.defaultPrevented).toBe(true);
    expect(unexpected.defaultPrevented).toBe(false);
  });
});

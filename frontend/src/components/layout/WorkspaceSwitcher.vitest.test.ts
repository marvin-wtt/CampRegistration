import { describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { Screen } from 'quasar';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import type * as WorkspaceArea from '@/components/layout/workspaceArea';

const CAMP_NAME = 'Sommerlager Bad Segeberg 2026';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    name: 'management.camp.dashboard',
    params: { campId: '01J0000000000000000000000A' },
  }),
}));

const locale = ref<string>('en');
const fallbackLocale = ref<string>('en');

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale,
    fallbackLocale,
    t: (key: string) => key,
  }),
}));

vi.mock('@/stores/camp-details-store', () => ({
  useCampDetailsStore: () => ({ data: { name: CAMP_NAME }, isLoading: false }),
}));

vi.mock('@/stores/organization-details-store', () => ({
  useOrganizationDetailsStore: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/stores/newsletter-store', () => ({
  useNewsletterStore: () => ({ data: [], isLoading: false }),
}));

// The panel itself is exercised through its own stores; here only the shell it
// is rendered in matters.
vi.mock('@/components/layout/workspaceArea', async (importOriginal) => ({
  ...(await importOriginal<typeof WorkspaceArea>()),
  useWorkspacePrefetch: () => undefined,
}));

installQuasarPlugin();

async function mountAt(width: number): Promise<VueWrapper> {
  Screen.setDebounce(0);
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
  await nextTick();

  const wrapper = mount(WorkspaceSwitcher, {
    attachTo: document.body,
    global: { stubs: { WorkspaceSwitcherMenu: true } },
  });
  await nextTick();

  return wrapper;
}

describe('WorkspaceSwitcher', () => {
  it('opens the panel as a bottom sheet on a phone', async () => {
    const wrapper = await mountAt(390);

    expect(wrapper.findComponent({ name: 'QMenu' }).exists()).toBe(false);

    await wrapper.get('.workspace-switcher').trigger('click');
    await nextTick();

    const dialog = wrapper.findComponent({ name: 'QDialog' });
    expect(dialog.exists()).toBe(true);
    expect(dialog.props('position')).toBe('bottom');
  });

  it('spells out the current workspace in the sheet header', async () => {
    const wrapper = await mountAt(390);

    await wrapper.get('.workspace-switcher').trigger('click');
    await nextTick();

    // The trigger truncates, so the sheet is the only place the whole name of
    // the current camp is readable on a phone.
    expect(
      document.body.querySelector('.workspace-switcher-sheet__name')
        ?.textContent,
    ).toContain(CAMP_NAME);
  });

  it('keeps the anchored menu on a desktop screen', async () => {
    const wrapper = await mountAt(1280);

    expect(wrapper.findComponent({ name: 'QMenu' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'QDialog' }).exists()).toBe(false);
  });
});

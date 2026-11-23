import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useCreateEventFlow } from '@/composables/createEventFlow';

const mocks = vi.hoisted(() => ({
  dialog: vi.fn(),
  push: vi.fn(),
  fetchData: vi.fn(),
  organizations: [] as { id: string; name: string }[],
  eligible: { value: [] as string[] },
}));

vi.mock('quasar', () => ({
  useQuasar: () => ({ dialog: mocks.dialog }),
}));
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock('@/stores/organizations-store', () => ({
  useOrganizationsStore: () => ({
    fetchData: mocks.fetchData,
    get data() {
      return mocks.organizations;
    },
  }),
}));
vi.mock('@/composables/organizationPermissions', () => ({
  useOrganizationPermissions: () => ({
    eventCreationOrganizationIds: mocks.eligible,
  }),
}));
vi.mock('@/components/event/index/EventCreateDialog.vue', () => ({
  default: { name: 'EventCreateDialog' },
}));
vi.mock('@/components/event/index/EventOrganizationRequiredDialog.vue', () => ({
  default: { name: 'EventOrganizationRequiredDialog' },
}));
vi.mock('@/components/organization/OrganizationCreateDialog.vue', () => ({
  default: { name: 'OrganizationCreateDialog' },
}));

// Each opened dialog is answered with the next queued payload, in order.
let answers: unknown[] = [];

beforeEach(() => {
  mocks.dialog.mockReset().mockImplementation(() => {
    const payload = answers.shift();
    return {
      onOk: (handler: (value: unknown) => void) => {
        if (payload !== undefined) {
          handler(payload);
        }
      },
    };
  });
  mocks.push.mockReset();
  mocks.fetchData.mockReset().mockResolvedValue(undefined);
  mocks.organizations = [];
  mocks.eligible = ref<string[]>([]);
  answers = [];
});

function openedDialogs() {
  return mocks.dialog.mock.calls.map(([options]) => ({
    name: (options.component as { name: string }).name,
    props: options.componentProps as Record<string, unknown> | undefined,
  }));
}

describe('useCreateEventFlow', () => {
  it('opens the event dialog when an organization permits it', async () => {
    mocks.eligible.value = ['org-1'];
    answers = [{ id: 'event-1' }];

    await useCreateEventFlow().createEvent('org-1');

    expect(openedDialogs()).toEqual([
      { name: 'EventCreateDialog', props: { organizationId: 'org-1' } },
    ]);
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'management.event.dashboard',
      params: { eventId: 'event-1' },
    });
  });

  it('drops a preselection the user cannot create under', async () => {
    mocks.eligible.value = ['org-1'];

    await useCreateEventFlow().createEvent('org-2');

    expect(openedDialogs()[0]?.props).toEqual({ organizationId: undefined });
  });

  it('founds an organization first when the user has none', async () => {
    answers = [true, { id: 'org-new' }, { id: 'event-1' }];
    mocks.dialog.mockImplementationOnce(() => ({
      onOk: (handler: () => void) => {
        answers.shift();
        // The new organization reaches the profile before the event dialog.
        mocks.eligible.value = ['org-new'];
        handler();
      },
    }));

    await useCreateEventFlow().createEvent();

    expect(openedDialogs()).toEqual([
      {
        name: 'EventOrganizationRequiredDialog',
        props: { reason: 'none', organizationNames: [] },
      },
      { name: 'OrganizationCreateDialog', props: undefined },
      { name: 'EventCreateDialog', props: { organizationId: 'org-new' } },
    ]);
    expect(mocks.push).toHaveBeenCalledOnce();
  });

  it('names the organizations whose roles cannot create events', async () => {
    mocks.organizations = [{ id: 'org-1', name: 'Club' }];

    await useCreateEventFlow().createEvent();

    expect(openedDialogs()).toEqual([
      {
        name: 'EventOrganizationRequiredDialog',
        props: { reason: 'forbidden', organizationNames: ['Club'] },
      },
    ]);
  });
});

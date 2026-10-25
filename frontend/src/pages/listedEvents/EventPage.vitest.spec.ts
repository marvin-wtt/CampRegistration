import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, h } from 'vue';
import { Dialog, Meta } from 'quasar';
import type * as QuasarModule from 'quasar';
import type { EventDetails } from '@camp-registration/common/entities';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import EventPage from '@/pages/listedEvents/EventPage.vue';

installQuasarPlugin({ plugins: { Dialog, Meta } });

const api = {
  fetchEvent: vi.fn(),
  createRegistration: vi.fn(),
  createTemporaryFile: vi.fn(),
};

vi.mock('@/services/APIService', () => ({
  useAPIService: () => api,
  isAPIServiceError: () => false,
}));

vi.mock('@/composables/permissions', () => ({
  usePermissions: () => ({ canFor: () => false }),
}));

// Confirms every dialog, so `changeGroup` proceeds.
vi.mock('quasar', async (importOriginal) => {
  const quasar = await importOriginal<typeof QuasarModule>();
  return {
    ...quasar,
    useQuasar: () => ({
      dialog: () => ({ onOk: (ok: () => void) => ok() }),
    }),
  };
});

// The form itself is covered by its own tests; here only its key and group
// matter, and the events it sends to the page.
let formMounts = 0;
const RegistrationFormStub = defineComponent({
  name: 'RegistrationForm',
  props: {
    group: { type: String, default: null },
    submitFn: { type: Function, default: null },
  },
  emits: ['restart', 'activeChange', 'bgColorUpdate'],
  setup(props) {
    formMounts += 1;
    return () => h('div', { 'data-test': 'form', 'data-group': props.group });
  },
});

function eventWith(countries: string[]): EventDetails {
  return {
    id: 'event-1',
    name: 'Summer Camp',
    countries,
    contactEmail: 'info@example.com',
    freePlaces: Object.fromEntries(countries.map((c) => [c, 3])),
    maxParticipants: Object.fromEntries(countries.map((c) => [c, 10])),
    registrationStatus: 'open',
    startAt: '2027-01-26T09:00:00',
    endAt: '2027-02-02T17:00:00',
    location: 'Sometown',
    registrationOpensAt: null,
    registrationClosesAt: null,
    form: {},
    themes: {},
  } as unknown as EventDetails;
}

let router: Router;

async function mountPage(countries: string[], url = '/events/event-1') {
  api.fetchEvent.mockResolvedValue(eventWith(countries));
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/events/:eventId', name: 'event', component: EventPage }],
  });
  await router.push(url);

  const wrapper = mount(EventPage, {
    attachTo: document.body,
    global: {
      plugins: [router],
      stubs: {
        RegistrationForm: RegistrationFormStub,
        PrivacyNoticeDisclosure: true,
      },
    },
  });
  await flushPromises();

  return wrapper;
}

const form = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.find('[data-test="form"]');

beforeEach(() => {
  formMounts = 0;
  // The floating header's slot the group button is teleported into.
  const header = document.createElement('div');
  header.id = 'event-header-actions';
  document.body.appendChild(header);
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('EventPage', () => {
  describe('group choice', () => {
    it('asks for the group of a multi-country event first', async () => {
      const wrapper = await mountPage(['de', 'fr']);

      expect(
        wrapper.find('[data-test="registration-group-select"]').exists(),
      ).toBe(true);
      expect(form(wrapper).exists()).toBe(false);
    });

    it('opens the form for the chosen group, as a history entry', async () => {
      const wrapper = await mountPage(['de', 'fr']);

      await wrapper
        .find('[data-test="registration-group-fr"]')
        .trigger('click');
      await flushPromises();

      expect(router.currentRoute.value.query.group).toBe('fr');
      expect(form(wrapper).attributes('data-group')).toBe('fr');
    });

    it('opens the form directly for a group preselected by a link', async () => {
      const wrapper = await mountPage(['de', 'fr'], '/events/event-1?group=FR');

      expect(form(wrapper).attributes('data-group')).toBe('fr');
    });

    it('asks again for a group the event does not run', async () => {
      const wrapper = await mountPage(['de', 'fr'], '/events/event-1?group=it');

      expect(form(wrapper).exists()).toBe(false);
    });

    it('skips the choice for a single-country event', async () => {
      const wrapper = await mountPage(['de']);

      expect(form(wrapper).attributes('data-group')).toBe('de');
    });
  });

  it('returns to the choice after confirming a group change', async () => {
    const wrapper = await mountPage(['de', 'fr'], '/events/event-1?group=fr');

    document
      .querySelector<HTMLElement>('[data-test="registration-group"]')!
      .click();
    await flushPromises();
    document
      .querySelector<HTMLElement>('[data-test="registration-group-change"]')!
      .click();
    await flushPromises();

    expect(router.currentRoute.value.query.group).toBeUndefined();
    expect(
      wrapper.find('[data-test="registration-group-select"]').exists(),
    ).toBe(true);
  });

  describe('register another person', () => {
    it('starts an empty form for a single-country event', async () => {
      const wrapper = await mountPage(['de']);
      expect(formMounts).toBe(1);

      wrapper.findComponent(RegistrationFormStub).vm.$emit('restart');
      await flushPromises();

      expect(formMounts).toBe(2);
      expect(form(wrapper).attributes('data-group')).toBe('de');
    });

    it('asks for the group again on a multi-country event', async () => {
      const wrapper = await mountPage(['de', 'fr'], '/events/event-1?group=fr');

      wrapper.findComponent(RegistrationFormStub).vm.$emit('restart');
      await flushPromises();

      expect(router.currentRoute.value.query.group).toBeUndefined();
      expect(
        wrapper.find('[data-test="registration-group-select"]').exists(),
      ).toBe(true);
    });
  });

  it('submits the chosen group with the answers', async () => {
    const wrapper = await mountPage(['de', 'fr'], '/events/event-1?group=fr');
    const submit = wrapper
      .findComponent(RegistrationFormStub)
      .props('submitFn') as (
      id: string,
      data: object,
      locale: string,
    ) => Promise<unknown>;

    await submit('event-1', { first_name: 'Ann' }, 'de-DE');

    expect(api.createRegistration).toHaveBeenCalledWith('event-1', {
      data: { first_name: 'Ann' },
      locale: 'de-DE',
      group: 'fr',
    });
  });
});

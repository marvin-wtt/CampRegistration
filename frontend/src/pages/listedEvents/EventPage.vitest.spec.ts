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
  submitRegistration: vi.fn(),
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

function eventWith(
  countries: string[],
  overrides: Partial<EventDetails> = {},
): EventDetails {
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
    ...overrides,
  } as unknown as EventDetails;
}

let router: Router;

async function mountPage(
  countries: string[],
  url = '/events/event-1',
  overrides: Partial<EventDetails> = {},
) {
  api.fetchEvent.mockResolvedValue(eventWith(countries, overrides));
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

    expect(api.submitRegistration).toHaveBeenCalledWith('event-1', {
      data: { first_name: 'Ann' },
      locale: 'de-DE',
      group: 'fr',
    });
  });

  describe('contacts while registration is closed', () => {
    const closed = {
      registrationStatus: 'closed',
      contactEmail: {
        de: 'de@example.com',
        at: 'de@example.com',
        fr: 'fr@example.com',
      },
    } as const;

    const contacts = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
      wrapper.findAll('[data-test="event-contact"]').map((contact) => ({
        email: contact.attributes('href'),
        groups: contact.find('[data-test="event-contact-groups"]').exists()
          ? contact.find('[data-test="event-contact-groups"]').text()
          : null,
      }));

    it('labels every contact with the groups it answers for', async () => {
      const wrapper = await mountPage(
        ['de', 'at', 'fr'],
        '/events/event-1',
        closed,
      );

      expect(contacts(wrapper)).toEqual([
        { email: 'mailto:de@example.com', groups: 'Germany, Austria' },
        { email: 'mailto:fr@example.com', groups: 'France' },
      ]);
    });

    it("shows only the linked group's contact", async () => {
      const wrapper = await mountPage(
        ['de', 'at', 'fr'],
        '/events/event-1?group=fr',
        closed,
      );

      expect(contacts(wrapper)).toEqual([
        { email: 'mailto:fr@example.com', groups: null },
      ]);
    });

    it('leaves a contact shared by every group unlabelled', async () => {
      const wrapper = await mountPage(['de', 'fr'], '/events/event-1', {
        registrationStatus: 'closed',
        contactEmail: { de: 'info@example.com', fr: 'info@example.com' },
      });

      expect(contacts(wrapper)).toEqual([
        { email: 'mailto:info@example.com', groups: null },
      ]);
    });
  });
});

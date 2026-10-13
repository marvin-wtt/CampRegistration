import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import RegistrationForm from '@/components/common/RegistrationForm.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { SurveyComponent } from 'survey-vue3-ui';
import type { SurveyModel } from 'survey-core';
// The app loads it in the surveyJS boot file.
import 'survey-core/i18n/german';

// The completed-page markup builds action links via `router.resolve(...)`;
// stub it out since routing itself is irrelevant to these tests.
vi.mock('vue-router', () => ({
  useRouter: () => ({
    resolve: (to: { name: string; params?: Record<string, string> }) => ({
      href: `/${[to.name, ...Object.values(to.params ?? {})].join('/')}`,
    }),
  }),
}));

installQuasarPlugin();

describe('RegistrationForm', () => {
  const simpleEventDetails = {
    id: '',
    organizationId: '',
    organizationName: '',
    organizationVerificationStatus: 'VERIFIED' as const,
    name: 'Test',
    confirmationMode: 'AUTOMATIC' as const,
    listed: true,
    registrationOpensAt: null,
    registrationClosesAt: null,
    countries: [],
    locales: [],
    organizer: '',
    contactEmail: '',
    maxParticipants: 0,
    startAt: '',
    endAt: '',
    timezone: 'UTC',
    minAge: 0,
    maxAge: 0,
    price: 0,
    currency: 'EUR',
    location: '',
    freePlaces: 0,
    freePlacesTotal: 0,
    registrationStatus: 'closed' as const,
    logo: null,
    banner: null,
    form: {
      title: '',
      description: '',
      pages: [],
    },
    themes: {},
  };

  it('should mount', () => {
    const wrapper = mount(RegistrationForm, {
      props: {
        eventDetails: {
          ...simpleEventDetails,
        },
        submitFn: () => Promise.reject(new Error()),
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('shows the custom success panel when the form defines no completed page', async () => {
    const submitFn = vi.fn().mockResolvedValue(undefined);

    const wrapper = mount(RegistrationForm, {
      props: {
        // simpleEventDetails.form has no completedHtml
        eventDetails: { ...simpleEventDetails, id: 'event-1' },
        submitFn,
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    const survey = wrapper
      .getComponent(SurveyComponent)
      .props('model') as SurveyModel;

    survey.doComplete();
    await flushPromises();

    expect(submitFn).toHaveBeenCalledTimes(1);

    // When the form has no completed page, our Vue success panel takes over.
    const status = wrapper.find('[data-test="registration-submit-status"]');
    expect(status.exists()).toBe(true);
    expect(status.text()).toContain('complete.title');
  });

  it.each([
    {
      name: 'a localized completedHtml',
      form: { completedHtml: { en: 'Done', de: 'Fertig' } },
      custom: true,
    },
    {
      name: 'a matching completedHtmlOnCondition',
      form: {
        completedHtmlOnCondition: [{ expression: 'true', html: 'Done' }],
      },
      custom: true,
    },
    {
      name: 'only a non-matching completedHtmlOnCondition',
      form: {
        completedHtmlOnCondition: [{ expression: 'false', html: 'Done' }],
      },
      custom: false,
    },
  ])('detects the form-defined completed page for $name', async (testCase) => {
    const wrapper = mount(RegistrationForm, {
      props: {
        eventDetails: {
          ...simpleEventDetails,
          id: 'event-1',
          form: { ...simpleEventDetails.form, ...testCase.form },
        },
        submitFn: vi.fn().mockResolvedValue(undefined),
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    const survey = wrapper
      .getComponent(SurveyComponent)
      .props('model') as SurveyModel;

    survey.doComplete();
    await flushPromises();

    expect(
      wrapper.find('[data-test="registration-submit-status"]').exists(),
    ).toBe(!testCase.custom);
  });

  it('asks the page for a fresh form to register another person', async () => {
    const wrapper = mount(RegistrationForm, {
      props: {
        eventDetails: { ...simpleEventDetails, id: 'event-1' },
        submitFn: vi.fn().mockResolvedValue(undefined),
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    const survey = wrapper
      .getComponent(SurveyComponent)
      .props('model') as SurveyModel;
    survey.doComplete();
    await flushPromises();

    await wrapper
      .find('[data-test="registration-register-another"]')
      .trigger('click');

    expect(wrapper.emitted('restart')).toHaveLength(1);
  });

  it('shows the custom error status without touching the completed page', async () => {
    const submitFn = vi.fn(() =>
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      Promise.reject({
        isAxiosError: true,
        response: {
          data: {
            message: 'Registration is closed',
          },
          statusText: 'Forbidden',
        },
      }),
    );

    const wrapper = mount(RegistrationForm, {
      props: {
        eventDetails: {
          ...simpleEventDetails,
          id: 'event-1',
          form: {
            ...simpleEventDetails.form,
            completedHtml: 'Registration successful',
          },
        },
        submitFn,
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    const survey = wrapper
      .getComponent(SurveyComponent)
      .props('model') as SurveyModel;

    survey.doComplete();
    await flushPromises();

    expect(submitFn).toHaveBeenCalledTimes(1);
    // The form-defined completed page is left untouched; the error UI is a
    // separate Vue overlay shown over the (hidden) survey.
    expect(survey.completedHtml).toBe('Registration successful');

    const status = wrapper.find('[data-test="registration-submit-status"]');
    expect(status.exists()).toBe(true);
    expect(status.text()).toContain('submit.error.title');
    expect(status.text()).toContain('Registration is closed');
  });

  it('retries the submission when the retry button is clicked', async () => {
    const submitFn = vi
      .fn()
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: { message: 'Temporary error' },
          statusText: 'Service Unavailable',
        },
      })
      .mockResolvedValueOnce(undefined);

    const wrapper = mount(RegistrationForm, {
      props: {
        eventDetails: {
          ...simpleEventDetails,
          id: 'event-1',
          form: {
            ...simpleEventDetails.form,
            completedHtml: 'Registration successful',
          },
        },
        submitFn,
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    const survey = wrapper
      .getComponent(SurveyComponent)
      .props('model') as SurveyModel;

    survey.doComplete();
    await flushPromises();

    expect(submitFn).toHaveBeenCalledTimes(1);
    expect(
      wrapper.find('[data-test="registration-submit-status"]').text(),
    ).toContain('submit.error.title');

    await wrapper
      .find('[data-test="registration-submit-retry"]')
      .trigger('click');
    await flushPromises();

    // The retry re-fires onComplete and, on success, reveals the survey's
    // completed page and dismisses the error overlay.
    expect(submitFn).toHaveBeenCalledTimes(2);
    expect(survey.showCompletePage).toBe(true);
    expect(
      wrapper.find('[data-test="registration-submit-status"]').exists(),
    ).toBe(false);
  });

  it('shows a pending-specific message when the registration is left pending', async () => {
    const submitFn = vi
      .fn()
      .mockResolvedValue({ id: 'reg-1', status: 'PENDING' });

    const wrapper = mount(RegistrationForm, {
      props: {
        eventDetails: { ...simpleEventDetails, id: 'event-1' },
        submitFn,
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    const survey = wrapper
      .getComponent(SurveyComponent)
      .props('model') as SurveyModel;

    survey.doComplete();
    await flushPromises();

    const status = wrapper.find('[data-test="registration-submit-status"]');
    expect(status.text()).toContain('complete.pending.title');
  });

  it('shows a waitlist-specific message when the registration is waitlisted', async () => {
    const submitFn = vi
      .fn()
      .mockResolvedValue({ id: 'reg-1', status: 'WAITLISTED' });

    const wrapper = mount(RegistrationForm, {
      props: {
        eventDetails: { ...simpleEventDetails, id: 'event-1' },
        submitFn,
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    const survey = wrapper
      .getComponent(SurveyComponent)
      .props('model') as SurveyModel;

    survey.doComplete();
    await flushPromises();

    const status = wrapper.find('[data-test="registration-submit-status"]');
    expect(status.text()).toContain('complete.waitlisted.title');
  });

  it.todo('should set variables');

  it.todo('should render markdown');

  it.todo('should upload files');

  it.todo('should map files');

  it.todo('should submit the form');

  describe('complete button text', () => {
    function completeText(price: number, form: object = {}) {
      const wrapper = mount(RegistrationForm, {
        props: {
          eventDetails: {
            ...simpleEventDetails,
            price,
            form: { ...simpleEventDetails.form, ...form },
          },
          submitFn: () => Promise.resolve(),
          uploadFileFn: () => Promise.reject(new Error()),
        },
      });
      const survey = wrapper
        .getComponent(SurveyComponent)
        .props('model') as SurveyModel;
      survey.locale = 'de';

      return { survey, text: survey.completeText };
    }

    it('says registering costs money when the event has a price', () => {
      expect(completeText(120).text).toBe('Kostenpflichtig anmelden');
    });

    it('asks for a binding registration when the event is free', () => {
      expect(completeText(0).text).toBe('Verbindlich anmelden');
    });

    it('keeps a text set in the form editor', () => {
      expect(
        completeText(120, { completeText: { de: 'Jetzt anmelden' } }).text,
      ).toBe('Jetzt anmelden');
    });

    it('never writes the default into the form JSON', () => {
      expect(completeText(120).survey.toJSON()).not.toHaveProperty(
        'completeText',
      );
    });
  });

  describe('amount summary', () => {
    // A priced option: its answer is what the registration costs.
    const pricedForm = {
      pages: [
        {
          name: 'page1',
          elements: [
            {
              type: 'text',
              name: 'option',
              inputType: 'number',
              eventDataType: 'payment_amount',
            },
          ],
        },
      ],
    };

    function mountForm(price: number, form: object) {
      const wrapper = mount(RegistrationForm, {
        props: {
          eventDetails: {
            ...simpleEventDetails,
            price,
            form: { ...simpleEventDetails.form, ...form },
          },
          submitFn: () => Promise.resolve(),
          uploadFileFn: () => Promise.reject(new Error()),
        },
      });
      const survey = wrapper
        .getComponent(SurveyComponent)
        .props('model') as SurveyModel;

      return {
        survey,
        summary: () =>
          wrapper.find('[data-test="registration-amount-summary"]'),
      };
    }

    it('shows the event price above the button on the last page', async () => {
      const { summary } = mountForm(120, {
        pages: [{ name: 'page1', elements: [{ type: 'text', name: 'a' }] }],
      });
      await flushPromises();

      expect(summary().exists()).toBe(true);
      expect(summary().text()).toContain('120.00');
    });

    it('turns a free event paid once a priced answer is given', async () => {
      const { survey, summary } = mountForm(0, pricedForm);
      survey.locale = 'de';
      await flushPromises();

      expect(summary().exists()).toBe(false);
      expect(survey.completeText).toBe('Verbindlich anmelden');

      survey.setValue('option', 45);
      await flushPromises();

      expect(summary().text()).toContain('45.00');
      expect(survey.completeText).toBe('Kostenpflichtig anmelden');
    });

    it('shows nothing for a free event', async () => {
      const { summary } = mountForm(0, {
        pages: [{ name: 'page1', elements: [{ type: 'text', name: 'a' }] }],
      });
      await flushPromises();

      expect(summary().exists()).toBe(false);
    });
  });

  describe('redirect after submit', () => {
    function mountWithRedirect(
      submitFn: () => Promise<void>,
      options: { url?: string; moderation?: boolean } = {},
    ) {
      const wrapper = mount(RegistrationForm, {
        props: {
          eventDetails: {
            ...simpleEventDetails,
            id: 'event-1',
            form: {
              ...simpleEventDetails.form,
              navigateToUrl: options.url ?? 'https://example.org/thanks',
            },
          },
          submitFn,
          uploadFileFn: () => Promise.reject(new Error()),
          moderation: options.moderation ?? false,
        },
      });
      return wrapper
        .getComponent(SurveyComponent)
        .props('model') as SurveyModel;
    }

    function mockAssign() {
      return vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('waits for the submission before redirecting', async () => {
      const assign = mockAssign();
      let finishSubmit!: () => void;
      const survey = mountWithRedirect(
        () => new Promise<void>((resolve) => (finishSubmit = resolve)),
      );

      // Registered after the component's own handler, so it sees whether
      // survey-core may still navigate on its own.
      const surveyNavigation: boolean[] = [];
      survey.onNavigateToUrl.add((_, options) => {
        surveyNavigation.push(options.allow);
      });

      survey.doComplete();
      await flushPromises();
      expect(surveyNavigation).toEqual([false]);
      expect(assign).not.toHaveBeenCalled();

      finishSubmit();
      await flushPromises();
      expect(assign).toHaveBeenCalledExactlyOnceWith(
        'https://example.org/thanks',
      );
    });

    it('stays on the page when the submission fails', async () => {
      const assign = mockAssign();
      const survey = mountWithRedirect(() => Promise.reject(new Error()));

      survey.doComplete();
      await flushPromises();

      expect(assign).not.toHaveBeenCalled();
    });

    it('never redirects a manager editing a registration', async () => {
      const assign = mockAssign();
      const survey = mountWithRedirect(() => Promise.resolve(), {
        moderation: true,
      });

      survey.doComplete();
      await flushPromises();

      expect(assign).not.toHaveBeenCalled();
    });

    it('ignores URLs that are not web addresses', async () => {
      const assign = mockAssign();
      const survey = mountWithRedirect(() => Promise.resolve(), {
        url: 'javascript:alert(1)',
      });

      survey.doComplete();
      await flushPromises();

      expect(assign).not.toHaveBeenCalled();
    });
  });

  it.todo('should not submit when invalid');

  it.todo('should skip validation when moderating');
});

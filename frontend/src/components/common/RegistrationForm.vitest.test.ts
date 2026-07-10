import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import RegistrationForm from '@/components/common/RegistrationForm.vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { SurveyComponent } from 'survey-vue3-ui';
import type { SurveyModel } from 'survey-core';

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
  const simpleCampDetails = {
    id: '',
    name: 'Test',
    confirmationMode: 'AUTOMATIC' as const,
    public: true,
    registrationOpensAt: null,
    registrationClosesAt: null,
    countries: [],
    locales: [],
    organizer: '',
    contactEmail: '',
    maxParticipants: 0,
    startAt: '',
    endAt: '',
    minAge: 0,
    maxAge: 0,
    price: 0,
    location: '',
    freePlaces: 0,
    registrationStatus: 'closed' as const,
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
        campDetails: {
          ...simpleCampDetails,
        },
        submitFn: () => Promise.reject(new Error()),
        uploadFileFn: () => Promise.reject(new Error()),
      },
    });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('replaces success completed HTML when submit fails', async () => {
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
        campDetails: {
          ...simpleCampDetails,
          id: 'camp-1',
          form: {
            ...simpleCampDetails.form,
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
    expect(survey.showCompletePage).toBe(true);
    expect(survey.completedHtml).toContain('submit.error.title');
    expect(survey.completedHtml).not.toContain('Registration successful');
    expect(survey.completedState).toBe('error');
    expect(survey.completedStateText).toBe('Registration is closed');
  });
  it.todo('should set variables');

  it.todo('should render markdown');

  it.todo('should upload files');

  it.todo('should map files');

  it.todo('should submit the form');

  it.todo('should not submit when invalid');

  it.todo('should skip validation when moderating');
});

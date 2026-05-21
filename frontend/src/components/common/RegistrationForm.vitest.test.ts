import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RegistrationForm from 'components/common/RegistrationForm.vue';
import { installQuasarPlugin } from 'app/test/vitest/utils/quasar';

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

  it.todo('should set variables');

  it.todo('should render markdown');

  it.todo('should upload files');

  it.todo('should map files');

  it.todo('should submit the form');

  it.todo('should not submit when invalid');

  it.todo('should skip validation when moderating');
});

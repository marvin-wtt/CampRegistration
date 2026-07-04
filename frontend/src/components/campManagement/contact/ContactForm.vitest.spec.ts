import { describe, expect, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia } from 'pinia';
import { Notify, QForm } from 'quasar';
import { installQuasarPlugin } from 'app/test/vitest/utils/quasar';
import ContactForm from 'components/campManagement/contact/ContactForm.vue';
import type {
  Contact,
  ContactDraft,
} from 'components/campManagement/contact/Contact';
import type { Message, ServiceFile } from '@camp-registration/common/entities';

installQuasarPlugin({ plugins: { Notify } });

const campDetails = {
  id: 'camp-1',
  contactEmail: 'contact@example.com',
  form: { title: '', description: '', pages: [] },
};

const createMessageMock = vi.fn();

vi.mock('stores/camp-details-store', () => ({
  useCampDetailsStore: () => ({
    data: campDetails,
    fetchData: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('src/composables/permissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));

vi.mock('src/services/APIService', () => ({
  useAPIService: () => ({
    createMessage: createMessageMock,
    duplicateMessageAttachments: vi.fn(),
  }),
  isAPIServiceError: () => false,
}));

function createFile(overrides: Partial<ServiceFile> = {}): ServiceFile {
  return {
    id: 'file-1',
    name: 'attachment.pdf',
    field: null,
    locale: null,
    type: 'application/pdf',
    size: 1234,
    accessLevel: null,
    uploadStatus: 'READY',
    createdAt: '2024-01-01T00:00:00Z',
    url: 'http://example.com/file-1',
    ...overrides,
  };
}

function createDraft(overrides: Partial<ContactDraft> = {}): ContactDraft {
  return {
    subject: 'Old subject',
    body: 'Old body',
    priority: 'high',
    replyTo: 'reply@example.com',
    attachments: [createFile()],
    ...overrides,
  };
}

function mountForm(
  props: Partial<{
    registrations: [];
    initialContacts: Contact[];
    draft: ContactDraft | null;
    standalone: boolean;
  }> = {},
) {
  return mount(ContactForm, {
    props: {
      registrations: [],
      draft: null,
      standalone: true,
      ...props,
    },
    global: {
      plugins: [createPinia()],
      stubs: {
        RegistrationEmailEditor: true,
        FileInput: true,
      },
    },
  });
}

beforeEach(() => {
  createMessageMock.mockReset();
  createMessageMock.mockResolvedValue({
    id: 'message-1',
    subject: 'sent',
    body: 'sent',
    replyTo: null,
    priority: 'normal',
    attachments: null,
    sentBy: null,
    createdAt: null,
  } satisfies Message);
});

describe('ContactForm dirty check', () => {
  it('is not dirty when freshly composing a new, empty message', () => {
    const wrapper = mountForm();

    expect(wrapper.vm.dirty).toBe(false);
  });

  it('is not dirty immediately after loading a reused draft (the draft is the pristine baseline)', async () => {
    const wrapper = mountForm();

    await wrapper.setProps({ draft: createDraft() });
    await nextTick();

    expect(wrapper.vm.dirty).toBe(false);
  });

  it('becomes dirty once the loaded draft content is edited', async () => {
    const wrapper = mountForm();
    await wrapper.setProps({ draft: createDraft() });
    await nextTick();

    const subjectEditor = wrapper.findAllComponents({
      name: 'RegistrationEmailEditor',
    })[0]!;
    await subjectEditor.vm.$emit('update:modelValue', 'New subject');

    expect(wrapper.vm.dirty).toBe(true);
  });

  it('is not dirty after successfully sending, even though the parent has not cleared the stale `draft` prop (regression)', async () => {
    const wrapper = mountForm();

    // Simulate reusing a previous message (ContactPage's onResend), which
    // populates the composer with non-empty content.
    await wrapper.setProps({ draft: createDraft() });
    await nextTick();
    expect(wrapper.vm.dirty).toBe(false);

    // Submitting the form sends the message and, on success, blanks the
    // fields via reset(). The parent (ContactPage) never clears the `draft`
    // prop, so it still holds the old, non-empty content here.
    await wrapper.findComponent(QForm).vm.$emit('submit');
    await flushPromises();

    expect(createMessageMock).toHaveBeenCalledOnce();
    expect(wrapper.emitted('sent')).toBeTruthy();
    // Before the fix, `dirty` compared the now-blank fields directly against
    // the stale `draft` prop and stayed `true` forever.
    expect(wrapper.vm.dirty).toBe(false);
  });

  it('is not dirty after a plain form reset while a draft is loaded (native reset event)', async () => {
    const wrapper = mountForm();

    await wrapper.setProps({ draft: createDraft() });
    await nextTick();

    const subjectEditor = wrapper.findAllComponents({
      name: 'RegistrationEmailEditor',
    })[0]!;
    await subjectEditor.vm.$emit('update:modelValue', 'Edited subject');
    expect(wrapper.vm.dirty).toBe(true);

    await wrapper.findComponent(QForm).vm.$emit('reset');
    await nextTick();

    expect(wrapper.vm.dirty).toBe(false);
  });
});

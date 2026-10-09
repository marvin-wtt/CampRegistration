import type { Registration } from '@camp-registration/common/entities';
import type { Contact } from '@/components/event/contact/Contact';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPersonName } from '@/utils/formatters';

export type RegistrationContactType = Exclude<Contact['type'], 'group'>;

/** A registration as a single recipient of the message composer. */
export function useRegistrationContact() {
  const { fullName, role } = useRegistrationHelper();

  function contactType(registration: Registration): RegistrationContactType {
    if (registration.status === 'PENDING') {
      return 'pending';
    }
    if (registration.status === 'WAITLISTED') {
      return 'waitingList';
    }

    const registrationRole = role(registration);

    return registrationRole === undefined || registrationRole === 'participant'
      ? 'participant'
      : 'counselor';
  }

  function contactFor(registration: Registration): Contact {
    return {
      type: contactType(registration),
      name: formatPersonName(fullName(registration)),
      registration,
    };
  }

  return { contactType, contactFor };
}

import { computed } from 'vue';
import type { Event } from '@camp-registration/common/entities';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { usePermissions } from '@/composables/permissions';
import { eventDays } from '@/composables/eventPhase';
import { formatPersonName } from '@/utils/formatters';

export interface Birthday {
  registrationId: string;
  name: string;
  /** The age being turned. */
  age: number;
}

/**
 * Birthdays of accepted registrants — participants and team — on the event's
 * days. Personal data: empty without `event.registrations.view`, and for
 * management views only, never the published program. The registrations
 * store is fetched by the caller.
 */
export function useEventBirthdays(event: () => Event | undefined) {
  const registrationsStore = useRegistrationsStore();
  const helper = useRegistrationHelper();
  const { can } = usePermissions();

  const accepted = computed(() =>
    can('event.registrations.view')
      ? (registrationsStore.data ?? []).filter(
          (r) => r.status === 'ACCEPTED' && r.computedData.dateOfBirth,
        )
      : [],
  );

  // Dates are `YYYY-MM-DD`, so a birthday is a matching `MM-DD`.
  function birthdaysOn(date: string): Birthday[] {
    const current = event();
    if (!current) {
      return [];
    }
    const { first, last } = eventDays(current);
    if (date < first || date > last) {
      return [];
    }

    return accepted.value
      .filter((r) => r.computedData.dateOfBirth?.slice(5) === date.slice(5))
      .map((r) => ({
        registrationId: r.id,
        name: formatPersonName(helper.uniqueName(r)),
        age:
          Number(date.slice(0, 4)) -
          Number(r.computedData.dateOfBirth?.slice(0, 4)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return { birthdaysOn };
}

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useChoreStore } from '@/stores/chore-store';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatPersonName } from '@/utils/formatters';
import { compareAssignments, findSlot, openSpots } from '@/utils/chores';

export interface DayDuty {
  id: string;
  title: string;
  names: string;
  open: number;
  done: boolean;
  cancelled: boolean;
}

/** The roster of one day (`YYYY-MM-DD`). The chore stores are fetched by the caller. */
export function useDayDuties(date: MaybeRefOrGetter<string>) {
  const choreStore = useChoreStore();
  const choreAssignmentStore = useChoreAssignmentStore();
  const registrationsStore = useRegistrationsStore();
  const registrationHelper = useRegistrationHelper();
  const { to } = useObjectTranslation();

  const duties = computed<DayDuty[]>(() => {
    const day = toValue(date);
    const choreById = new Map((choreStore.data ?? []).map((c) => [c.id, c]));
    const nameOf = (id: string) => {
      const registration = registrationsStore.data?.find((r) => r.id === id);
      return registration
        ? formatPersonName(registrationHelper.uniqueName(registration))
        : '?';
    };

    return (choreAssignmentStore.data ?? [])
      .filter((assignment) => assignment.date === day)
      .sort((a, b) => compareAssignments(a, b, choreById))
      .map((assignment) => {
        const chore = choreById.get(assignment.choreId);
        const slot = findSlot(chore, assignment.slotId);
        const choreName = chore ? to(chore.name) : '';
        return {
          id: assignment.id,
          title: slot ? `${choreName} — ${to(slot.name)}` : choreName,
          names: assignment.members
            .filter((m) => m.role === 'MEMBER' && !m.missed)
            .map((m) => nameOf(m.registrationId))
            .sort((a, b) => a.localeCompare(b))
            .join(', '),
          open:
            openSpots(assignment, chore, 'MEMBER') +
            openSpots(assignment, chore, 'SUPERVISOR'),
          done: assignment.status === 'DONE',
          cancelled: assignment.status === 'CANCELLED',
        };
      });
  });

  // Cancelled duties need no one.
  const openCount = computed<number>(() =>
    duties.value
      .filter((duty) => !duty.cancelled)
      .reduce((sum, duty) => sum + duty.open, 0),
  );

  const isLoading = computed<boolean>(
    () => choreStore.isLoading || choreAssignmentStore.isLoading,
  );

  return { duties, openCount, isLoading };
}

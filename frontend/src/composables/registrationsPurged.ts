import { computed } from 'vue';
import { useEventDetailsStore } from '@/stores/event-details-store';

/** Whether all registrations of the open event were deleted for good. */
export function useRegistrationsPurged() {
  const eventDetailsStore = useEventDetailsStore();

  return computed<boolean>(
    () => !!eventDetailsStore.data?.registrationDataPurgedAt,
  );
}

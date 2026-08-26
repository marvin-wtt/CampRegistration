import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useProfileStore } from '@/stores/profile-store';

// The EventManager id of the signed-in user for the active event, used to
// highlight items assigned to them. Comes from `profile.eventAccess`, so it needs
// no access to the manager roster; `undefined` for organization-derived access,
// which has no manager record.
export function useCurrentManager() {
  const eventDetailsStore = useEventDetailsStore();
  const profileStore = useProfileStore();
  const { data: event } = storeToRefs(eventDetailsStore);
  const { user } = storeToRefs(profileStore);

  const currentManagerId = computed<string | undefined>(() => {
    const eventId = event.value?.id;
    if (!eventId) {
      return undefined;
    }
    return (
      user.value?.eventAccess.find((access) => access.eventId === eventId)
        ?.managerId ?? undefined
    );
  });

  return { currentManagerId };
}

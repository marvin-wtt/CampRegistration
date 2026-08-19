import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { useProfileStore } from '@/stores/profile-store';

// The CampManager id of the signed-in user for the active camp, used to
// highlight items assigned to them. Comes from `profile.campAccess`, so it needs
// no access to the manager roster; `undefined` for organization-derived access,
// which has no manager record.
export function useCurrentManager() {
  const campDetailsStore = useCampDetailsStore();
  const profileStore = useProfileStore();
  const { data: camp } = storeToRefs(campDetailsStore);
  const { user } = storeToRefs(profileStore);

  const currentManagerId = computed<string | undefined>(() => {
    const campId = camp.value?.id;
    if (!campId) {
      return undefined;
    }
    return (
      user.value?.campAccess.find((access) => access.campId === campId)
        ?.managerId ?? undefined
    );
  });

  return { currentManagerId };
}

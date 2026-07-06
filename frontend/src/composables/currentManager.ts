import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCampManagerStore } from '@/stores/camp-manager-store';
import { useProfileStore } from '@/stores/profile-store';

// Resolves the CampManager record that belongs to the currently signed-in user
// for the active camp. Used to highlight tasks (and similar items) assigned to
// the current user.
export function useCurrentManager() {
  const campManagerStore = useCampManagerStore();
  const profileStore = useProfileStore();
  const { data: managers } = storeToRefs(campManagerStore);
  const { user } = storeToRefs(profileStore);

  const currentManagerId = computed<string | undefined>(() => {
    const email = user.value?.email;
    if (!email) {
      return undefined;
    }
    return managers.value?.find((manager) => manager.email === email)?.id;
  });

  return { currentManagerId };
}

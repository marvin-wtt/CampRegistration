import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile-store';
import { createScopePermissions } from '@/composables/scopePermissions';

/**
 * Newsletter-scoped counterpart to {@link usePermissions}. Kept as its own
 * composable so the scopes' helpers cannot be confused at a call site; the
 * shared logic lives in {@link createScopePermissions}.
 *
 * The current subject comes from the route rather than a details store, because
 * a newsletter is only ever open via `:newsletterId`.
 */
export function useNewsletterPermissions() {
  const profileStore = useProfileStore();
  const route = useRoute();

  const { user } = storeToRefs(profileStore);

  const { can, canAny, canFor, cannot, canAccess } =
    createScopePermissions<'newsletter'>({
      isAdmin: () => user.value?.role === 'ADMIN',
      granted: (newsletterId) =>
        (user.value?.newsletterAccess ?? []).find(
          (value) => value.newsletterId === newsletterId,
        )?.permissions ?? [],
      currentSubjectId: () => {
        const id = route.params.newsletterId;

        return Array.isArray(id) ? id[0] : id;
      },
    });

  return {
    canNewsletter: can,
    canNewsletterFor: canFor,
    canAnyNewsletter: canAny,
    cannotNewsletter: cannot,
    canAccessNewsletter: canAccess,
  };
}

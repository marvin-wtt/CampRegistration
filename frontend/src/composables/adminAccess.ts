import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useQuasar } from 'quasar';
import type { Profile } from '@camp-registration/common/entities';
import type { PermissionScope } from '@camp-registration/common/permissions';
import { useProfileStore } from '@/stores/profile-store';
import AdminAccessDialog from '@/components/administration/access/AdminAccessDialog.vue';

export interface AdminAccessSubject {
  scope: PermissionScope;
  id: string;
}

// The role that already holds every permission of its scope.
const FULL_ROLES: Record<PermissionScope, string> = {
  event: 'DIRECTOR',
  newsletter: 'OWNER',
  organization: 'ADMIN',
};

function ownRoleOf(
  profile: Profile | undefined,
  subject: AdminAccessSubject,
): string | undefined {
  switch (subject.scope) {
    case 'event':
      return profile?.eventAccess.find((a) => a.eventId === subject.id)?.role;
    case 'newsletter':
      return profile?.newsletterAccess.find(
        (a) => a.newsletterId === subject.id,
      )?.role;
    case 'organization':
      return profile?.organizationAccess.find(
        (a) => a.organizationId === subject.id,
      )?.role;
  }
}

/** Asks for a reason; resolves `true` once access is granted. */
export function useAdminAccessRequest() {
  const quasar = useQuasar();
  const profileStore = useProfileStore();

  function request(subject: AdminAccessSubject): Promise<boolean> {
    return new Promise((resolve) => {
      quasar
        .dialog({
          component: AdminAccessDialog,
          componentProps: { scope: subject.scope, scopeId: subject.id },
        })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });
  }

  /**
   * For administration pages acting on a resource: resolves `true` when the
   * action may go ahead, requesting access first unless the administrator
   * holds a grant or the full role there.
   */
  async function ensureAdminAccess(
    subject: AdminAccessSubject,
  ): Promise<boolean> {
    if (
      !profileStore.administrator ||
      profileStore.activeAdminAccess(subject.scope, subject.id) ||
      ownRoleOf(profileStore.user, subject) === FULL_ROLES[subject.scope]
    ) {
      return true;
    }

    return request(subject);
  }

  return { request, ensureAdminAccess };
}

/** Administrator access to one event, newsletter or organization. */
export function useAdminAccess(
  subject: MaybeRefOrGetter<AdminAccessSubject | undefined>,
) {
  const profileStore = useProfileStore();
  const { request } = useAdminAccessRequest();

  const ownRole = computed<string | undefined>(() => {
    const value = toValue(subject);

    return value ? ownRoleOf(profileStore.user, value) : undefined;
  });

  const grant = computed(() => {
    const value = toValue(subject);

    return value
      ? profileStore.activeAdminAccess(value.scope, value.id)
      : undefined;
  });

  // Never offered to someone whose own role already holds everything.
  const available = computed<boolean>(() => {
    const value = toValue(subject);

    return (
      !!value &&
      profileStore.administrator &&
      ownRole.value !== FULL_ROLES[value.scope]
    );
  });

  /** An administrator with no role here and no grant: nothing to show yet. */
  const required = computed<boolean>(
    () => available.value && ownRole.value === undefined && !grant.value,
  );

  function requestAccess(): Promise<boolean> {
    const value = toValue(subject);

    return value ? request(value) : Promise.resolve(false);
  }

  async function endAccess(): Promise<void> {
    if (grant.value) {
      await profileStore.endAdminAccess(grant.value.id);
    }
  }

  return { available, required, grant, requestAccess, endAccess };
}

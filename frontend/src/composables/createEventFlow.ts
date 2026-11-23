import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import type { Event, Organization } from '@camp-registration/common/entities';
import EventCreateDialog from '@/components/event/index/EventCreateDialog.vue';
import EventOrganizationRequiredDialog from '@/components/event/index/EventOrganizationRequiredDialog.vue';
import OrganizationCreateDialog from '@/components/organization/OrganizationCreateDialog.vue';
import { useOrganizationsStore } from '@/stores/organizations-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';

/**
 * Every "Create event" entry point. Without an organization that may create
 * events, the user founds one first and continues straight into the event
 * dialog with it selected; a created event opens on its dashboard.
 */
export function useCreateEventFlow() {
  const quasar = useQuasar();
  const router = useRouter();
  const organizationsStore = useOrganizationsStore();
  const { eventCreationOrganizationIds } = useOrganizationPermissions();

  async function createEvent(organizationId?: string): Promise<void> {
    await organizationsStore.fetchData();

    if (eventCreationOrganizationIds.value.length > 0) {
      openEventDialog(organizationId);
      return;
    }

    const organizationNames = (organizationsStore.data ?? []).map(
      (organization) => organization.name,
    );

    quasar
      .dialog({
        component: EventOrganizationRequiredDialog,
        componentProps: {
          reason: organizationNames.length > 0 ? 'forbidden' : 'none',
          organizationNames,
        },
      })
      .onOk(() => {
        quasar
          .dialog({ component: OrganizationCreateDialog })
          .onOk((organization: Organization) => {
            openEventDialog(organization.id);
          });
      });
  }

  function openEventDialog(organizationId?: string) {
    // A preselection the user can't create under would only fail on submit.
    const preselected =
      organizationId &&
      eventCreationOrganizationIds.value.includes(organizationId)
        ? organizationId
        : undefined;

    quasar
      .dialog({
        component: EventCreateDialog,
        componentProps: { organizationId: preselected },
      })
      .onOk((event: Event) => {
        void router.push({
          name: 'management.event.dashboard',
          params: { eventId: event.id },
        });
      });
  }

  return { createEvent };
}

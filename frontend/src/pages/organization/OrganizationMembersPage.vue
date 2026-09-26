<template>
  <page-state-handler
    padding
    :error
    :loading="isLoading"
    class="row justify-center"
  >
    <div class="column col-sm-10 col-md-8 col-12">
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h6">{{ t('title') }}</div>
        <div class="row q-gutter-sm">
          <q-btn
            flat
            round
            icon="help_outline"
            @click="showRoleHelp"
          >
            <q-tooltip>{{ t('action.roleHelp') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="canOrg('organization.members.create')"
            color="primary"
            icon="person_add"
            :label="t('action.add')"
            rounded
            unelevated
            no-caps
            data-test="organization-member-add"
            @click="showAddDialog"
          />
        </div>
      </div>

      <q-list
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="member in sortedMembers"
          :key="member.id"
        >
          <q-item-section>
            <q-item-label>
              {{ member.name ?? member.email }}
              <q-chip
                v-if="member.email === ownEmail"
                dense
                square
                size="sm"
              >
                {{ t('you') }}
              </q-chip>
            </q-item-label>
            <q-item-label caption>{{ member.email }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-xs">
              <q-chip
                v-if="member.status === 'PENDING'"
                dense
                square
                size="sm"
                icon="schedule"
              >
                {{ t('status.pending') }}
              </q-chip>
              <q-chip
                dense
                square
                size="sm"
                :class="`role--${member.role.toLowerCase()}`"
              >
                {{ t(`role.${member.role}`) }}
              </q-chip>
              <q-btn
                v-if="canManage(member)"
                flat
                round
                dense
                icon="more_vert"
              >
                <q-menu
                  anchor="bottom right"
                  self="top right"
                >
                  <q-list style="min-width: 150px">
                    <q-item
                      v-if="canOrg('organization.members.edit')"
                      v-close-popup
                      clickable
                      @click="showEditDialog(member)"
                    >
                      <q-item-section>{{ t('action.edit') }}</q-item-section>
                    </q-item>
                    <q-item
                      v-close-popup
                      clickable
                      class="text-negative"
                      @click="confirmRemove(member)"
                    >
                      <q-item-section>
                        {{
                          member.email === ownEmail
                            ? t('action.leave')
                            : t('action.remove')
                        }}
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import OrganizationMemberDialog from '@/components/organization/OrganizationMemberDialog.vue';
import OrganizationRolePermissionsDialog from '@/components/organization/OrganizationRolePermissionsDialog.vue';
import { useOrganizationMemberStore } from '@/stores/organization-member-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import { useProfileStore } from '@/stores/profile-store';
import type {
  OrganizationMember,
  OrganizationMemberCreateData,
  OrganizationMemberUpdateData,
} from '@camp-registration/common/entities';

const { t } = useI18n();
const quasar = useQuasar();
const store = useOrganizationMemberStore();
const { data, isLoading, error } = storeToRefs(store);
const { canOrg } = useOrganizationPermissions();
const { user } = storeToRefs(useProfileStore());

const ownEmail = computed(() => user.value?.email);

const roleOrder: Record<string, number> = { ADMIN: 0, MEMBER: 1 };

const sortedMembers = computed<OrganizationMember[]>(() =>
  [...(data.value ?? [])].sort(
    (a, b) =>
      (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9) ||
      (a.name ?? a.email).localeCompare(b.name ?? b.email),
  ),
);

/** Anyone may leave; changing others needs the delete permission. */
function canManage(member: OrganizationMember): boolean {
  return (
    member.email === ownEmail.value || canOrg('organization.members.delete')
  );
}

function showRoleHelp() {
  quasar.dialog({ component: OrganizationRolePermissionsDialog });
}

function showAddDialog() {
  quasar
    .dialog({ component: OrganizationMemberDialog })
    .onOk((payload: OrganizationMemberCreateData) => {
      void store.createData(payload);
    });
}

function showEditDialog(member: OrganizationMember) {
  quasar
    .dialog({
      component: OrganizationMemberDialog,
      componentProps: { member },
    })
    .onOk((payload: OrganizationMemberUpdateData) => {
      void store.updateData(member.id, payload);
    });
}

function confirmRemove(member: OrganizationMember) {
  const leaving = member.email === ownEmail.value;

  quasar
    .dialog({
      title: leaving ? t('confirm.leave.title') : t('confirm.remove.title'),
      message: leaving
        ? t('confirm.leave.message')
        : t('confirm.remove.message', { name: member.name ?? member.email }),
      cancel: {
        color: 'primary',
        outline: true,
      },
      ok: {
        label: leaving ? t('action.leave') : t('action.remove'),
        color: 'negative',
      },
      persistent: true,
    })
    .onOk(() => {
      void store.deleteData(member.id);
    });
}

onMounted(async () => {
  await store.fetchData();
});
</script>

<style lang="scss" scoped>
.role--admin {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.role--member {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Members'
you: 'You'
status:
  pending: 'Invited'
role:
  ADMIN: 'Admin'
  MEMBER: 'Member'
action:
  add: 'Add member'
  edit: 'Change role'
  remove: 'Remove'
  leave: 'Leave organization'
  roleHelp: 'What can each role do?'
confirm:
  remove:
    title: 'Remove member'
    message: 'Remove {name} from this organization?'
  leave:
    title: 'Leave organization'
    message: 'You will lose access to this organization.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Mitglieder'
you: 'Du'
status:
  pending: 'Eingeladen'
role:
  ADMIN: 'Admin'
  MEMBER: 'Mitglied'
action:
  add: 'Mitglied hinzufügen'
  edit: 'Rolle ändern'
  remove: 'Entfernen'
  leave: 'Organisation verlassen'
  roleHelp: 'Was darf welche Rolle?'
confirm:
  remove:
    title: 'Mitglied entfernen'
    message: '{name} aus dieser Organisation entfernen?'
  leave:
    title: 'Organisation verlassen'
    message: 'Du verlierst den Zugriff auf diese Organisation.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Membres'
you: 'Toi'
status:
  pending: 'Invité'
role:
  ADMIN: 'Admin'
  MEMBER: 'Membre'
action:
  add: 'Ajouter un membre'
  edit: 'Changer le rôle'
  remove: 'Retirer'
  leave: "Quitter l'organisation"
  roleHelp: 'Que peut faire chaque rôle ?'
confirm:
  remove:
    title: 'Retirer le membre'
    message: 'Retirer {name} de cette organisation ?'
  leave:
    title: "Quitter l'organisation"
    message: "Tu perdras l'accès à cette organisation."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Członkowie'
you: 'Ty'
status:
  pending: 'Zaproszony'
role:
  ADMIN: 'Administrator'
  MEMBER: 'Członek'
action:
  add: 'Dodaj członka'
  edit: 'Zmień rolę'
  remove: 'Usuń'
  leave: 'Opuść organizację'
  roleHelp: 'Co może każda rola?'
confirm:
  remove:
    title: 'Usuń członka'
    message: 'Usunąć {name} z tej organizacji?'
  leave:
    title: 'Opuść organizację'
    message: 'Stracisz dostęp do tej organizacji.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Členové'
you: 'Ty'
status:
  pending: 'Pozván'
role:
  ADMIN: 'Správce'
  MEMBER: 'Člen'
action:
  add: 'Přidat člena'
  edit: 'Změnit roli'
  remove: 'Odebrat'
  leave: 'Opustit organizaci'
  roleHelp: 'Co může která role?'
confirm:
  remove:
    title: 'Odebrat člena'
    message: 'Odebrat {name} z této organizace?'
  leave:
    title: 'Opustit organizaci'
    message: 'Ztratíš přístup k této organizaci.'
</i18n>

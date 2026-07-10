<template>
  <page-state-handler
    padding
    :error
    :loading
    class="access-page row justify-center"
  >
    <div class="access-content col-12 col-md-11 col-lg-10 column q-gutter-y-lg">
      <!-- Header -->
      <div class="row items-end justify-between q-col-gutter-y-sm">
        <div class="col-12 col-sm page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>

        <div class="col-12 col-sm-auto row items-center q-gutter-sm">
          <q-btn
            :label="quasar.screen.gt.sm ? t('action.roles') : undefined"
            :aria-label="t('action.roles')"
            icon="info_outline"
            flat
            no-caps
            dense
            class="text-grey-6"
            @click="showPermissionsDialog"
          />
          <m-btn
            v-if="can('camp.managers.create')"
            :label="t('action.add')"
            color="primary"
            icon="person_add"
            @click="showAddDialog"
          />
        </div>
      </div>

      <!-- Members / pending invitations -->
      <q-card
        v-for="section in sections"
        :key="section.key"
        flat
        bordered
        class="section-card"
      >
        <q-card-section class="q-pb-none">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-icon
              :name="section.icon"
              color="primary"
              size="20px"
            />
            <div class="text-subtitle2 text-weight-bold">
              {{ t('section.' + section.key) }}
            </div>
            <q-badge
              rounded
              class="count-badge"
              :label="section.managers.length"
            />
          </div>
        </q-card-section>

        <q-card-section class="q-px-none q-pb-xs">
          <q-list>
            <q-item
              v-for="manager in section.managers"
              :key="manager.id"
              class="member-row"
            >
              <q-item-section avatar>
                <q-avatar
                  size="44px"
                  font-size="15px"
                  class="member-avatar"
                  :class="roleClass(manager.role)"
                >
                  <q-icon
                    v-if="section.key === 'invitations'"
                    name="mail_outline"
                    size="20px"
                  />
                  <template v-else>
                    {{ initials(manager) }}
                  </template>
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="member-name">
                  <span class="ellipsis">
                    {{ manager.name ?? manager.email }}
                  </span>
                  <q-chip
                    v-if="userEmail === manager.email"
                    :label="t('you')"
                    class="md3-chip you-chip"
                  />
                </q-item-label>
                <q-item-label
                  v-if="manager.name"
                  class="member-email ellipsis"
                >
                  {{ manager.email }}
                </q-item-label>
              </q-item-section>

              <q-item-section
                side
                class="member-meta"
              >
                <q-chip
                  v-if="isExpired(manager)"
                  class="md3-chip expired-chip"
                  icon="schedule"
                  :label="t('expiry.expired')"
                />
                <span
                  v-else-if="manager.expiresAt"
                  class="member-expiry"
                >
                  <q-icon
                    name="schedule"
                    size="14px"
                  />
                  {{
                    t('expiry.until', {
                      date: d(manager.expiresAt, 'dateTime'),
                    })
                  }}
                </span>
                <q-chip
                  class="md3-chip role-chip"
                  :class="roleClass(manager.role)"
                  :label="t('role.' + manager.role.toLowerCase())"
                />
              </q-item-section>

              <q-item-section
                v-if="canManage(manager) || canLeave(manager)"
                side
                class="member-actions"
              >
                <q-btn
                  :aria-label="t('action.menu')"
                  icon="more_vert"
                  flat
                  round
                  size="sm"
                >
                  <q-menu>
                    <q-list style="min-width: 180px">
                      <q-item
                        v-if="canManage(manager) && can('camp.managers.edit')"
                        clickable
                        v-close-popup
                        @click="showEditDialog(manager)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="edit"
                            size="sm"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.edit') }}
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-if="canManage(manager) && can('camp.managers.delete')"
                        clickable
                        v-close-popup
                        class="text-negative"
                        @click="showDeleteDialog(manager)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="delete"
                            size="sm"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.delete') }}
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-if="canLeave(manager)"
                        clickable
                        v-close-popup
                        class="text-negative"
                        @click="showLeaveDialog(manager)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="logout"
                            size="sm"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.leave') }}
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Empty state -->
      <q-card
        v-if="rows.length === 0"
        flat
        bordered
        class="section-card"
      >
        <q-card-section class="column items-center text-center q-pa-xl">
          <q-icon
            name="group_add"
            size="56px"
            class="empty-icon"
          />
          <div class="text-subtitle1 text-weight-medium q-mt-md">
            {{ t('empty.title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('empty.message') }}
          </div>
          <m-btn
            v-if="can('camp.managers.create')"
            :label="t('action.add')"
            color="primary"
            icon="person_add"
            class="q-mt-md"
            @click="showAddDialog"
          />
        </q-card-section>
      </q-card>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useCampManagerStore } from '@/stores/camp-manager-store';
import { computed, onMounted } from 'vue';
import type {
  CampManager,
  CampManagerCreateData,
  CampManagerRole,
  CampManagerUpdateData,
} from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { type QSelectOption, useQuasar } from 'quasar';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import CampManagerCreateDialog from '@/components/campManagement/settings/access/CampManagerCreateDialog.vue';
import { useProfileStore } from '@/stores/profile-store';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import CampManagerUpdateDialog from '@/components/campManagement/settings/access/CampManagerUpdateDialog.vue';
import RolePermissionsDialog from '@/components/campManagement/settings/access/RolePermissionsDialog.vue';
import { usePermissions } from '@/composables/permissions';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const { t, d } = useI18n();
const campManagerStore = useCampManagerStore();
const profileStore = useProfileStore();
const campDetailsStore = useCampDetailsStore();
const { can } = usePermissions();

onMounted(async () => {
  await Promise.allSettled([
    campManagerStore.fetchData(),
    campDetailsStore.fetchData(),
  ]);
});

const error = computed<string | null>(() => {
  return campManagerStore.error ?? campDetailsStore.error;
});

const loading = computed<boolean>(() => {
  return campManagerStore.isLoading || campDetailsStore.isLoading;
});

const userEmail = computed<string | undefined>(() => {
  return profileStore.user?.email;
});

const rows = computed<CampManager[]>(() => {
  return campManagerStore.data ?? [];
});

interface AccessSection {
  key: 'members' | 'invitations';
  icon: string;
  managers: CampManager[];
}

const sections = computed<AccessSection[]>(() => {
  const pending = (manager: CampManager) =>
    manager.status.toUpperCase() === 'PENDING';

  return [
    {
      key: 'members' as const,
      icon: 'group',
      managers: sortManagers(rows.value.filter((m) => !pending(m))),
    },
    {
      key: 'invitations' as const,
      icon: 'forward_to_inbox',
      managers: sortManagers(rows.value.filter(pending)),
    },
  ].filter((section) => section.managers.length > 0);
});

const roleOrder = ['director', 'coordinator', 'counselor', 'viewer'];

function sortManagers(managers: CampManager[]): CampManager[] {
  const rank = (manager: CampManager): number => {
    const index = roleOrder.indexOf(manager.role.toLowerCase());
    return index === -1 ? roleOrder.length : index;
  };

  return [...managers].sort((a, b) => {
    return (
      rank(a) - rank(b) || (a.name ?? a.email).localeCompare(b.name ?? b.email)
    );
  });
}

function roleClass(role: string): string {
  const normalized = role.toLowerCase();
  return `role--${roleOrder.includes(normalized) ? normalized : 'viewer'}`;
}

function initials(manager: CampManager): string {
  const parts = (manager.name ?? manager.email).trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';

  return (first + last).toUpperCase();
}

function isExpired(manager: CampManager): boolean {
  return manager.expiresAt != null && new Date(manager.expiresAt) < new Date();
}

function canManage(manager: CampManager): boolean {
  return (
    userEmail.value !== manager.email &&
    (can('camp.managers.edit') || can('camp.managers.delete'))
  );
}

function isSoleDirector(manager: CampManager): boolean {
  if (manager.role !== 'DIRECTOR' || manager.expiresAt != null) {
    return false;
  }

  return (
    rows.value.filter((m) => m.role === 'DIRECTOR' && m.expiresAt === null)
      .length <= 1
  );
}

function canLeave(manager: CampManager): boolean {
  return userEmail.value === manager.email && !isSoleDirector(manager);
}

function getRoleOptions(): QSelectOption<CampManagerRole>[] {
  const roles = ['DIRECTOR', 'COORDINATOR', 'COUNSELOR', 'VIEWER'] as const;

  return roles.map((role) => ({
    label: t('role.' + role.toLocaleLowerCase()),
    value: role,
  }));
}

function showPermissionsDialog() {
  quasar.dialog({ component: RolePermissionsDialog });
}

function showAddDialog() {
  const date = new Date(campDetailsStore.data?.endAt ?? '');
  date.setHours(23, 59, 59, 999);

  quasar
    .dialog({
      component: CampManagerCreateDialog,
      componentProps: {
        date: date.toISOString(),
        roles: getRoleOptions(),
      },
    })
    .onOk((data: CampManagerCreateData) => {
      void campManagerStore.createData(data);
    });
}

function showEditDialog(manager: CampManager) {
  quasar
    .dialog({
      component: CampManagerUpdateDialog,
      componentProps: {
        manager,
        roles: getRoleOptions(),
      },
    })
    .onOk((payload: CampManagerUpdateData) => {
      void campManagerStore.updateData(manager.id, payload);
    });
}

function showDeleteDialog(manager: CampManager) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        label: t('dialog.delete.label'),
        value: manager.email,
      },
    })
    .onOk(() => {
      void campManagerStore.deleteData(manager.id);
    });
}

function showLeaveDialog(manager: CampManager) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.leave.title'),
        message: t('dialog.leave.message'),
        label: t('dialog.leave.label'),
        value: manager.email,
      },
    })
    .onOk(() => {
      void campManagerStore.deleteData(manager.id);
    });
}
</script>

<style scoped>
.access-content {
  max-width: 960px;
  padding-bottom: 24px;
}

/* The default page padding feels cramped under the app bar on phones. */
@media (max-width: 599px) {
  .access-page {
    padding-top: 24px;
  }
}

.section-card {
  border-radius: 16px;
}

.count-badge {
  min-width: 20px;
  padding: 2px 8px;
  justify-content: center;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 600;
}

.member-row {
  padding: 12px 16px;
}

.member-row + .member-row {
  border-top: 1px solid var(--md3-outline-variant);
}

.member-row .q-item__section--avatar {
  min-width: 0;
  padding-right: 12px;
}

.member-row .q-item__section--side {
  padding-left: 12px;
}

.member-avatar {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 8px;

  min-width: 0;
  font-weight: 500;
}

.member-email {
  color: var(--md3-on-surface-variant);
  font-size: 12px;
}

.member-meta {
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.member-actions {
  color: var(--md3-on-surface-variant);
}

.member-expiry {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  color: var(--md3-on-surface-variant);
  font-size: 12px;
  white-space: nowrap;
}

.md3-chip {
  height: 24px;
  margin: 0;
  padding: 0 10px;
  border-radius: 8px;

  font-size: 12px;
  font-weight: 500;
}

.md3-chip :deep(.q-icon) {
  font-size: 14px;
}

.you-chip {
  flex: none;
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.expired-chip {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.role--director {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.role--coordinator {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.role--counselor {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.role--viewer {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

/* On phones the chips drop to a full-width second line, aligned with the
   text column next to the avatar. */
@media (max-width: 599px) {
  .member-row {
    flex-wrap: wrap;
  }

  .member-meta {
    padding-top: 10px;
    order: 5;
    flex: 0 0 100%;
    justify-content: flex-end;
    padding-left: 56px;
    flex-direction: row-reverse;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Manage access'
subtitle: 'Control who can access this camp and which role they have.'

action:
  add: 'Add'
  delete: 'Remove'
  edit: 'Edit'
  leave: 'Leave camp'
  menu: 'Actions'
  roles: 'Role permissions'

section:
  members: 'Members'
  invitations: 'Pending invitations'

dialog:
  delete:
    title: 'Revoke access'
    message: 'Do you really want to revoke access for this user?'
    label: 'Email'
  leave:
    title: 'Leave camp'
    message: 'Do you really want to leave this camp? You will lose access.'
    label: 'Email'

expiry:
  until: 'Until {date}'
  expired: 'Expired'

empty:
  title: 'No one has access yet'
  message: 'Invite team members to manage this camp together.'

you: 'You'

role:
  coordinator: 'Coordinator'
  counselor: 'Counselor'
  director: 'Director'
  viewer: 'Viewer'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zugriff verwalten'
subtitle: 'Legen Sie fest, wer auf dieses Camp zugreifen kann und welche Rolle die Person hat.'

action:
  add: 'Hinzufügen'
  delete: 'Entfernen'
  edit: 'Bearbeiten'
  leave: 'Camp verlassen'
  menu: 'Aktionen'
  roles: 'Rollenberechtigungen'

section:
  members: 'Mitglieder'
  invitations: 'Ausstehende Einladungen'

dialog:
  delete:
    title: 'Zugriff entziehen'
    message: 'Möchten Sie den Zugriff dieses Nutzers wirklich entziehen?'
    label: 'E-Mail'
  leave:
    title: 'Camp verlassen'
    message: 'Möchten Sie dieses Camp wirklich verlassen? Sie verlieren dadurch den Zugriff.'
    label: 'E-Mail'

expiry:
  until: 'Bis {date}'
  expired: 'Abgelaufen'

empty:
  title: 'Noch niemand hat Zugriff'
  message: 'Laden Sie Teammitglieder ein, um dieses Camp gemeinsam zu verwalten.'

you: 'Sie'

role:
  coordinator: 'Koordinator'
  counselor: 'Betreuer'
  director: 'Leiter'
  viewer: 'Betrachter'
</i18n>

<i18n lang="yaml" locale="fr">
title: ‘Gérer l’accès’
subtitle: ‘Contrôlez qui peut accéder à ce camp et quel rôle chaque personne possède.’

action:
  add: ‘Ajouter’
  delete: ‘Supprimer’
  edit: ‘Modifier’
  leave: ‘Quitter le camp’
  menu: ‘Actions’
  roles: ‘Permissions par rôle’

section:
  members: ‘Membres’
  invitations: ‘Invitations en attente’

dialog:
  delete:
    title: ‘Révoquer l’accès’
    message: ‘Voulez-vous vraiment révoquer l’accès de cet utilisateur ?’
    label: ‘E-mail’
  leave:
    title: ‘Quitter le camp’
    message: ‘Voulez-vous vraiment quitter ce camp ? Vous perdrez l’accès.’
    label: ‘E-mail’

expiry:
  until: ‘Jusqu’au {date}’
  expired: ‘Expiré’

empty:
  title: ‘Personne n’a encore accès’
  message: ‘Invitez des membres de l’équipe pour gérer ce camp ensemble.’

you: ‘Vous’

role:
  coordinator: ‘Coordinateur’
  counselor: ‘Conseiller’
  director: ‘Directeur’
  viewer: ‘Lecteur’
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zarządzaj dostępem'
subtitle: 'Kontroluj, kto ma dostęp do tego obozu i jaką pełni rolę.'

action:
  add: 'Dodaj'
  delete: 'Usuń'
  edit: 'Edytuj'
  leave: 'Opuść obóz'
  menu: 'Akcje'
  roles: 'Uprawnienia ról'

section:
  members: 'Członkowie'
  invitations: 'Oczekujące zaproszenia'

dialog:
  delete:
    title: 'Cofnij dostęp'
    message: 'Czy na pewno chcesz cofnąć dostęp temu użytkownikowi?'
    label: 'E-mail'
  leave:
    title: 'Opuść obóz'
    message: 'Czy na pewno chcesz opuścić ten obóz? Stracisz do niego dostęp.'
    label: 'E-mail'

expiry:
  until: 'Do {date}'
  expired: 'Wygasł'

empty:
  title: 'Nikt nie ma jeszcze dostępu'
  message: 'Zaproś członków zespołu, aby wspólnie zarządzać tym obozem.'

you: 'Ty'

role:
  coordinator: 'Koordynator'
  counselor: 'Opiekun'
  director: 'Kierownik'
  viewer: 'Podglądający'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Správa přístupu'
subtitle: 'Určete, kdo má k tomuto táboru přístup a jakou má roli.'

action:
  add: 'Přidat'
  delete: 'Odstranit'
  edit: 'Upravit'
  leave: 'Opustit tábor'
  menu: 'Akce'
  roles: 'Oprávnění rolí'

section:
  members: 'Členové'
  invitations: 'Čekající pozvánky'

dialog:
  delete:
    title: 'Odebrat přístup'
    message: 'Opravdu chcete odebrat přístup tomuto uživateli?'
    label: 'E-mail'
  leave:
    title: 'Opustit tábor'
    message: 'Opravdu chcete opustit tento tábor? Ztratíte k němu přístup.'
    label: 'E-mail'

expiry:
  until: 'Do {date}'
  expired: 'Vypršelo'

empty:
  title: 'Zatím nikdo nemá přístup'
  message: 'Pozvěte členy týmu a spravujte tento tábor společně.'

you: 'Vy'

role:
  coordinator: 'Koordinátor'
  counselor: 'Vedoucí'
  director: 'Ředitel'
  viewer: 'Pozorovatel'
</i18n>

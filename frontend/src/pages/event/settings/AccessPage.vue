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
            v-if="can('event.managers.create')"
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
                        v-if="canManage(manager) && can('event.managers.edit')"
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
                        v-if="
                          canManage(manager) && can('event.managers.delete')
                        "
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
            v-if="can('event.managers.create')"
            :label="t('action.add')"
            color="primary"
            icon="person_add"
            class="q-mt-md"
            @click="showAddDialog"
          />
        </q-card-section>
      </q-card>

      <!-- Access held outside this list, so it is not read as exhaustive. -->
      <q-card
        v-if="organizationName"
        flat
        bordered
        class="section-card org-card"
      >
        <q-card-section class="row items-start no-wrap q-gutter-sm">
          <q-icon
            name="apartment"
            color="primary"
            size="20px"
            class="org-icon"
          />
          <div class="col">
            <div class="text-subtitle2 text-weight-bold">
              {{ t('organization.title', { organization: organizationName }) }}
            </div>
            <div class="text-body2 text-grey-6 q-mt-xs">
              {{ t('organization.message') }}
            </div>
            <q-btn
              :label="t('action.roles')"
              icon="info_outline"
              flat
              no-caps
              dense
              color="primary"
              class="q-mt-sm"
              @click="showPermissionsDialog"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useEventManagerStore } from '@/stores/event-manager-store';
import { computed, onMounted } from 'vue';
import type {
  EventManager,
  EventManagerCreateData,
  EventManagerRole,
  EventManagerUpdateData,
} from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { type QSelectOption, useQuasar } from 'quasar';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import EventManagerCreateDialog from '@/components/event/settings/access/EventManagerCreateDialog.vue';
import { useAssignedEventsStore } from '@/stores/assigned-events-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import EventManagerUpdateDialog from '@/components/event/settings/access/EventManagerUpdateDialog.vue';
import RolePermissionsDialog from '@/components/event/settings/access/RolePermissionsDialog.vue';
import { usePermissions } from '@/composables/permissions';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { useRouter } from 'vue-router';
import { useProfileStore } from '@/stores/profile-store';

const quasar = useQuasar();
const { t, d } = useI18n();
const eventManagerStore = useEventManagerStore();
const assignedEventsStore = useAssignedEventsStore();
const eventDetailsStore = useEventDetailsStore();
const profileStore = useProfileStore();
const { can } = usePermissions();
const router = useRouter();

onMounted(async () => {
  await Promise.allSettled([
    eventManagerStore.fetchData(),
    eventDetailsStore.fetchData(),
  ]);
});

const error = computed<string | null>(() => {
  return eventManagerStore.error ?? eventDetailsStore.error;
});

const loading = computed<boolean>(() => {
  return eventManagerStore.isLoading || eventDetailsStore.isLoading;
});

const userEmail = computed<string | undefined>(() => {
  return profileStore.user?.email;
});

const rows = computed<EventManager[]>(() => {
  return eventManagerStore.data ?? [];
});

const organizationName = computed<string | undefined>(() => {
  return eventDetailsStore.data?.organizationName;
});

interface AccessSection {
  key: 'members' | 'invitations';
  icon: string;
  managers: EventManager[];
}

const sections = computed<AccessSection[]>(() => {
  const pending = (manager: EventManager) =>
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

function sortManagers(managers: EventManager[]): EventManager[] {
  const rank = (manager: EventManager): number => {
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

function initials(manager: EventManager): string {
  const parts = (manager.name ?? manager.email).trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';

  return (first + last).toUpperCase();
}

function isExpired(manager: EventManager): boolean {
  return manager.expiresAt != null && new Date(manager.expiresAt) < new Date();
}

function canManage(manager: EventManager): boolean {
  return (
    userEmail.value !== manager.email &&
    (can('event.managers.edit') || can('event.managers.delete'))
  );
}

function isSoleDirector(manager: EventManager): boolean {
  if (manager.role !== 'DIRECTOR' || manager.expiresAt != null) {
    return false;
  }

  return (
    rows.value.filter((m) => m.role === 'DIRECTOR' && m.expiresAt === null)
      .length <= 1
  );
}

function canLeave(manager: EventManager): boolean {
  return userEmail.value === manager.email && !isSoleDirector(manager);
}

function getRoleOptions(): QSelectOption<EventManagerRole>[] {
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
  quasar
    .dialog({
      component: EventManagerCreateDialog,
      componentProps: {
        eventEndAt: eventDetailsStore.data?.endAt,
        roles: getRoleOptions(),
      },
    })
    .onOk((data: EventManagerCreateData) => {
      void eventManagerStore.createData(data);
    });
}

function showEditDialog(manager: EventManager) {
  quasar
    .dialog({
      component: EventManagerUpdateDialog,
      componentProps: {
        manager,
        eventEndAt: eventDetailsStore.data?.endAt,
        roles: getRoleOptions(),
      },
    })
    .onOk((payload: EventManagerUpdateData) => {
      void eventManagerStore.updateData(manager.id, payload);
    });
}

function showDeleteDialog(manager: EventManager) {
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
      void eventManagerStore.deleteData(manager.id);
    });
}

function showLeaveDialog(manager: EventManager) {
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
      void leaveEvent(manager);
    });
}

async function leaveEvent(manager: EventManager) {
  await eventManagerStore.deleteData(manager.id);
  await assignedEventsStore.reload();
  await router.push({ name: 'management.events' });
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

.org-card {
  background: var(--md3-surface-container-low);
}

.org-icon {
  margin-top: 2px;
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
subtitle: 'Control who can access this event and which role they have.'

action:
  add: 'Add'
  delete: 'Remove'
  edit: 'Edit'
  leave: 'Leave event'
  menu: 'Actions'
  roles: 'Role permissions'

section:
  members: 'Members'
  invitations: 'Pending invitations'

organization:
  title: 'Administrators of {organization} also have partial access'
  message: 'Administrators of the owning organization can view and edit the event settings and see this list, without appearing here. They cannot see registrations, participants or their personal data.'

dialog:
  delete:
    title: 'Revoke access'
    message: 'Do you really want to revoke access for this user?'
    label: 'Email'
  leave:
    title: 'Leave event'
    message: 'Do you really want to leave this event? You will lose access.'
    label: 'Email'

expiry:
  until: 'Until {date}'
  expired: 'Expired'

empty:
  title: 'No one has access yet'
  message: 'Invite team members to manage this event together.'

you: 'You'

role:
  coordinator: 'Coordinator'
  counselor: 'Counselor'
  director: 'Director'
  viewer: 'Viewer'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zugriff verwalten'
subtitle: 'Legen Sie fest, wer auf diese Veranstaltung zugreifen kann und welche Rolle die Person hat.'

action:
  add: 'Hinzufügen'
  delete: 'Entfernen'
  edit: 'Bearbeiten'
  leave: 'Veranstaltung verlassen'
  menu: 'Aktionen'
  roles: 'Rollenberechtigungen'

section:
  members: 'Mitglieder'
  invitations: 'Ausstehende Einladungen'

organization:
  title: 'Administratoren von {organization} haben ebenfalls eingeschränkten Zugriff'
  message: 'Administratoren der besitzenden Organisation können die Veranstaltungseinstellungen einsehen und bearbeiten sowie diese Liste sehen, ohne hier aufgeführt zu sein. Anmeldungen, Teilnehmer und deren personenbezogene Daten können sie nicht einsehen.'

dialog:
  delete:
    title: 'Zugriff entziehen'
    message: 'Möchten Sie den Zugriff dieses Nutzers wirklich entziehen?'
    label: 'E-Mail'
  leave:
    title: 'Veranstaltung verlassen'
    message: 'Möchten Sie diese Veranstaltung wirklich verlassen? Sie verlieren dadurch den Zugriff.'
    label: 'E-Mail'

expiry:
  until: 'Bis {date}'
  expired: 'Abgelaufen'

empty:
  title: 'Noch niemand hat Zugriff'
  message: 'Laden Sie Teammitglieder ein, um diese Veranstaltung gemeinsam zu verwalten.'

you: 'Sie'

role:
  coordinator: 'Koordinator'
  counselor: 'Betreuer'
  director: 'Leiter'
  viewer: 'Betrachter'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Gérer l'accès"
subtitle: 'Contrôlez qui peut accéder à cet événement et quel rôle chaque personne possède.'

action:
  add: 'Ajouter'
  delete: 'Supprimer'
  edit: 'Modifier'
  leave: "Quitter l'événement"

  menu: 'Actions'
  roles: 'Permissions par rôle'

section:
  members: 'Membres'
  invitations: 'Invitations en attente'

organization:
  title: 'Les administrateurs de {organization} ont également un accès partiel'
  message: "Les administrateurs de l'organisation propriétaire peuvent consulter et modifier les paramètres de l'événement et voir cette liste, sans y figurer. Ils ne peuvent pas consulter les inscriptions, les participants ni leurs données personnelles."

dialog:
  delete:
    title: "Révoquer l'accès"
    message: "Voulez-vous vraiment révoquer l'accès de cet utilisateur ?"
    label: 'E-mail'
  leave:
    title: "Quitter l'événement"

    message: "Voulez-vous vraiment quitter cet événement ? Vous perdrez l'accès."
    label: 'E-mail'

expiry:
  until: "Jusqu'au {date}"
  expired: 'Expiré'

empty:
  title: "Personne n'a encore accès"
  message: "Invitez des membres de l'équipe pour gérer cet événement ensemble."

you: 'Vous'

role:
  coordinator: 'Coordinateur'
  counselor: 'Conseiller'
  director: 'Directeur'
  viewer: 'Lecteur'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zarządzaj dostępem'
subtitle: 'Kontroluj, kto ma dostęp do tego wydarzenia i jaką pełni rolę.'

action:
  add: 'Dodaj'
  delete: 'Usuń'
  edit: 'Edytuj'
  leave: 'Opuść wydarzenie'
  menu: 'Akcje'
  roles: 'Uprawnienia ról'

section:
  members: 'Członkowie'
  invitations: 'Oczekujące zaproszenia'

organization:
  title: 'Administratorzy organizacji {organization} również mają częściowy dostęp'
  message: 'Administratorzy organizacji będącej właścicielem mogą przeglądać i edytować ustawienia wydarzenia oraz widzieć tę listę, nie będąc na niej wymienieni. Nie mogą przeglądać rejestracji, uczestników ani ich danych osobowych.'

dialog:
  delete:
    title: 'Cofnij dostęp'
    message: 'Czy na pewno chcesz cofnąć dostęp temu użytkownikowi?'
    label: 'E-mail'
  leave:
    title: 'Opuść wydarzenie'
    message: 'Czy na pewno chcesz opuścić to wydarzenie? Stracisz do niego dostęp.'
    label: 'E-mail'

expiry:
  until: 'Do {date}'
  expired: 'Wygasł'

empty:
  title: 'Nikt nie ma jeszcze dostępu'
  message: 'Zaproś członków zespołu, aby wspólnie zarządzać tym wydarzeniem.'

you: 'Ty'

role:
  coordinator: 'Koordynator'
  counselor: 'Opiekun'
  director: 'Kierownik'
  viewer: 'Podglądający'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Správa přístupu'
subtitle: 'Určete, kdo má k této akci přístup a jakou má roli.'

action:
  add: 'Přidat'
  delete: 'Odstranit'
  edit: 'Upravit'
  leave: 'Opustit akci'
  menu: 'Akce'
  roles: 'Oprávnění rolí'

section:
  members: 'Členové'
  invitations: 'Čekající pozvánky'

organization:
  title: 'Částečný přístup mají také správci organizace {organization}'
  message: 'Správci vlastnící organizace mohou zobrazit a upravovat nastavení akce a vidět tento seznam, aniž by zde byli uvedeni. Nemohou zobrazit registrace, účastníky ani jejich osobní údaje.'

dialog:
  delete:
    title: 'Odebrat přístup'
    message: 'Opravdu chcete odebrat přístup tomuto uživateli?'
    label: 'E-mail'
  leave:
    title: 'Opustit akci'
    message: 'Opravdu chcete opustit tuto akci? Ztratíte k ní přístup.'
    label: 'E-mail'

expiry:
  until: 'Do {date}'
  expired: 'Vypršelo'

empty:
  title: 'Zatím nikdo nemá přístup'
  message: 'Pozvěte členy týmu a spravujte tuto akci společně.'

you: 'Vy'

role:
  coordinator: 'Koordinátor'
  counselor: 'Vedoucí'
  director: 'Ředitel'
  viewer: 'Pozorovatel'
</i18n>

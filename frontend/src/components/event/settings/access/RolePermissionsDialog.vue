<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="roles-dialog">
      <q-card-section class="dialog-header row items-center no-wrap q-pb-sm">
        <q-icon
          name="security"
          color="primary"
          size="22px"
          class="q-mr-sm"
        />
        <div class="text-subtitle1 text-weight-bold">
          {{ t('title') }}
        </div>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          :aria-label="t('close')"
          @click="onDialogCancel"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none dialog-content">
        <div
          v-if="loading"
          class="pm-loading"
        >
          <q-spinner
            color="primary"
            size="32px"
          />
        </div>

        <div
          v-else
          class="pm-wrap"
        >
          <div
            class="pm-matrix"
            role="table"
          >
            <!-- Role header -->
            <div
              class="pm-row pm-head"
              role="row"
            >
              <div class="pm-feature-col" />
              <div
                v-for="role in roles"
                :key="role"
                class="pm-role-col pm-role-head"
                role="columnheader"
              >
                <span
                  class="md3-chip role-chip"
                  :class="roleClass(role)"
                >
                  {{ roleLabel(role) }}
                </span>
              </div>
            </div>

            <!-- Feature rows -->
            <div
              v-for="row in orderedRows"
              :key="row.group"
              class="pm-row pm-body-row"
              role="row"
            >
              <div
                class="pm-feature-col pm-feature"
                role="rowheader"
              >
                <q-avatar
                  size="34px"
                  class="pm-feature-avatar"
                >
                  <q-icon
                    :name="groupIcon(row.group)"
                    size="18px"
                  />
                </q-avatar>
                <span class="pm-feature-label">
                  {{ groupLabel(row.group) }}
                </span>
              </div>

              <div
                v-for="role in roles"
                :key="role"
                class="pm-role-col"
                :data-role="roleLabel(role)"
                role="cell"
              >
                <div
                  v-if="row.actions[role]?.length"
                  class="pm-actions"
                >
                  <q-chip
                    v-for="action in row.actions[role]"
                    :key="action"
                    dense
                    class="pm-action-chip"
                    :icon="actionIcon(action)"
                    :label="actionLabel(action)"
                  />
                </div>
                <span
                  v-else
                  class="pm-none"
                  aria-hidden="true"
                >
                  <q-icon
                    name="remove"
                    size="18px"
                  />
                </span>
              </div>
            </div>
          </div>

          <!-- Access that no event role grants, so the matrix alone misleads. -->
          <div class="org-note">
            <q-icon
              name="apartment"
              size="20px"
              class="org-note-icon"
            />
            <div class="org-note-body">
              <div class="org-note-title">
                {{ t('organization.title') }}
              </div>
              <div class="org-note-text">
                {{ t('organization.description') }}
              </div>
              <div class="pm-actions org-note-actions">
                <q-chip
                  v-for="grant in organizationGrants"
                  :key="grant.permission"
                  dense
                  class="pm-action-chip"
                  :icon="actionIcon(grant.action)"
                  :label="`${groupLabel(grant.group)}: ${actionLabel(grant.action)}`"
                />
              </div>
              <div class="org-note-text org-note-limit">
                <q-icon
                  name="lock"
                  size="14px"
                />
                {{ t('organization.limit') }}
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import {
  splitPermission,
  usePermissionMatrix,
} from '@/composables/permissionMatrix';
import { ORGANIZATION_EVENT_PERMISSIONS } from '@camp-registration/common/permissions';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const i18n = useI18n();
const t = (key: string) => i18n.t(key);
// Wrapped rather than destructured: `te` reads `this` internally.
const te = (key: string) => i18n.te(key);

const { load, roles, rows } = usePermissionMatrix('event');

const loading = ref(true);

onMounted(async () => {
  try {
    await load();
  } finally {
    loading.value = false;
  }
});

/**
 * Display order. Groups the server sends that are not listed here still render,
 * appended at the end — a new permission must never silently vanish from the
 * matrix the way the previously hardcoded table let it.
 */
const GROUP_ORDER = [
  'event',
  'files',
  'registrations',
  'managers',
  'messages',
  'message_templates',
  'table_templates',
  'rooms',
  'rooms.beds',
  'program_items',
  'tasks',
  'chores',
  'chore_assignments',
];

const GROUP_ICONS: Record<string, string> = {
  event: 'tune',
  files: 'folder_open',
  registrations: 'how_to_reg',
  managers: 'manage_accounts',
  messages: 'mail',
  message_templates: 'mark_email_read',
  table_templates: 'table_chart',
  rooms: 'meeting_room',
  'rooms.beds': 'bed',
  program_items: 'event_note',
  tasks: 'task_alt',
  chores: 'cleaning_services',
  chore_assignments: 'checklist',
};

/** Group keys whose translation predates the derived name. */
const GROUP_I18N_ALIAS: Record<string, string> = {
  'rooms.beds': 'beds',
  program_items: 'program',
};

/** `event.tasks.update` and `event.program_items.update` read as "edit" in the UI. */
const ACTION_I18N_ALIAS: Record<string, string> = { update: 'edit' };

const ACTION_ICONS: Record<string, string> = {
  view: 'visibility',
  create: 'add_circle',
  edit: 'edit',
  update: 'edit',
  delete: 'delete',
};

const orderedRows = computed(() =>
  [...rows.value].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a.group);
    const bi = GROUP_ORDER.indexOf(b.group);

    return (
      (ai === -1 ? GROUP_ORDER.length : ai) -
      (bi === -1 ? GROUP_ORDER.length : bi)
    );
  }),
);

/**
 * The fixed set an administrator of the owning organization holds on every event
 * it owns, without a manager record. Read from the shared constant the backend
 * enforces rather than restated here, so the two cannot drift — it is
 * deliberately absent from `GET /permissions`, which only serves role grants.
 */
const organizationGrants = computed(() =>
  ORGANIZATION_EVENT_PERMISSIONS.map((permission) => ({
    permission,
    ...splitPermission('event', permission),
  })),
);

const KNOWN_ROLE_CLASSES = ['director', 'coordinator', 'counselor', 'viewer'];

function roleClass(role: string): string {
  const normalized = role.toLowerCase();
  return `role--${KNOWN_ROLE_CLASSES.includes(normalized) ? normalized : 'viewer'}`;
}

function roleLabel(role: string): string {
  const key = `role.${role.toLowerCase()}`;
  return te(key) ? t(key) : role;
}

function groupLabel(group: string): string {
  const key = `permissions.group.${GROUP_I18N_ALIAS[group] ?? group}`;
  return te(key) ? t(key) : group;
}

function actionLabel(action: string): string {
  const key = `permissions.action.${ACTION_I18N_ALIAS[action] ?? action}`;
  return te(key) ? t(key) : action;
}

function groupIcon(group: string): string {
  return GROUP_ICONS[group] ?? 'category';
}

function actionIcon(action: string): string {
  return ACTION_ICONS[action] ?? 'circle';
}
</script>

<style scoped>
.roles-dialog {
  width: 100%;
  max-width: min(900px, 95vw);
}

.dialog-header {
  padding: 16px 16px 12px;
}

.dialog-content {
  max-height: 75vh;
  overflow-y: auto;
}

.pm-wrap {
  overflow-x: auto;
  padding: 16px;
}

.pm-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.pm-matrix {
  min-width: 720px;
  overflow: hidden;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 16px;
  background: var(--md3-surface);
}

.pm-row {
  display: grid;
  grid-template-columns: minmax(178px, 1.2fr) repeat(4, minmax(128px, 1fr));
  align-items: stretch;
}

.pm-row + .pm-row {
  border-top: 1px solid var(--md3-outline-variant);
}

.pm-head {
  background: var(--md3-surface-container-low);
}

.pm-feature-col,
.pm-role-col {
  min-width: 0;
  padding: 12px;
}

.pm-feature-col {
  border-right: 1px solid var(--md3-outline-variant);
}

.pm-role-col + .pm-role-col {
  border-left: 1px solid var(--md3-outline-variant);
}

.pm-role-head {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pm-feature {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pm-feature-avatar {
  flex: none;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.pm-feature-label {
  color: var(--md3-on-surface);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
}

.pm-role-col {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 58px;
}

.pm-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.pm-action-chip {
  height: 28px;
  margin: 0;
  padding: 0 8px;
  border-radius: 8px;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 500;
}

.pm-action-chip :deep(.q-icon) {
  margin-right: 5px;
  font-size: 15px;
}

.pm-none {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--md3-surface-container-low);
  color: var(--md3-outline);
}

.org-note {
  display: flex;
  gap: 12px;

  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 16px;
  background: var(--md3-surface-container-low);
}

.org-note-icon {
  flex: none;
  margin-top: 2px;
  color: var(--md3-primary);
}

.org-note-body {
  min-width: 0;
}

.org-note-title {
  color: var(--md3-on-surface);
  font-size: 13px;
  font-weight: 600;
}

.org-note-text {
  margin-top: 4px;
  color: var(--md3-on-surface-variant);
  font-size: 12px;
  line-height: 1.45;
}

.org-note-actions {
  justify-content: flex-start;
  margin-top: 10px;
}

.org-note-limit {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-weight: 500;
}

.md3-chip {
  height: 24px;
  margin: 0;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
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

@media (max-width: 840px) {
  .pm-wrap {
    overflow: visible;
    padding: 12px;
  }

  .pm-matrix {
    display: grid;
    min-width: 0;
    gap: 12px;
    border: 0;
    background: transparent;
  }

  .pm-row {
    display: block;
    overflow: hidden;
    border: 1px solid var(--md3-outline-variant);
    border-radius: 16px;
    background: var(--md3-surface);
  }

  .pm-head {
    display: none;
  }

  .pm-row + .pm-row {
    border-top: 1px solid var(--md3-outline-variant);
  }

  .pm-feature-col {
    border-right: 0;
    border-bottom: 1px solid var(--md3-outline-variant);
    background: var(--md3-surface-container-low);
  }

  .pm-role-col {
    position: relative;
    justify-content: flex-start;
    min-height: 48px;
    padding: 10px 12px 10px 112px;
  }

  .pm-role-col + .pm-role-col {
    border-left: 0;
    border-top: 1px solid var(--md3-outline-variant);
  }

  .pm-role-col::before {
    content: attr(data-role);
    position: absolute;
    left: 12px;
    top: 50%;
    max-width: 88px;
    transform: translateY(-50%);
    color: var(--md3-on-surface-variant);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.15;
  }

  .pm-actions {
    justify-content: flex-start;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Role permissions'
close: 'Close'

role:
  coordinator: 'Coordinator'
  counselor: 'Counselor'
  director: 'Director'
  viewer: 'Viewer'

permissions:
  group:
    event: 'Event settings'
    files: 'Files'
    registrations: 'Registrations'
    managers: 'Team access'
    messages: 'Messages'
    message_templates: 'Message templates'
    table_templates: 'Table templates'
    rooms: 'Rooms'
    beds: 'Beds'
    program: 'Program'
    tasks: 'Tasks'
    chores: 'Chores'
    chore_assignments: 'Duty roster'
  action:
    view: 'View'
    create: 'Create'
    edit: 'Edit'
    delete: 'Delete'

organization:
  title: 'Organization administrators have partial access'
  description: 'Administrators of the organization that owns this event always have the following access, even without being listed as a member. It cannot be removed here.'
  limit: 'They can never see registrations, participants or their personal data.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Rollenberechtigungen'
close: 'Schließen'

role:
  coordinator: 'Koordinator'
  counselor: 'Betreuer'
  director: 'Leiter'
  viewer: 'Betrachter'

permissions:
  group:
    event: 'Veranstaltungseinstellungen'
    files: 'Dateien'
    registrations: 'Anmeldungen'
    managers: 'Team-Zugriff'
    messages: 'Nachrichten'
    message_templates: 'Nachrichtenvorlagen'
    table_templates: 'Tabellenvorlagen'
    rooms: 'Räume'
    beds: 'Betten'
    program: 'Programm'
    tasks: 'Aufgaben'
    chores: 'Diensttypen'
    chore_assignments: 'Dienstplan'
  action:
    view: 'Anzeigen'
    create: 'Erstellen'
    edit: 'Bearbeiten'
    delete: 'Löschen'

organization:
  title: 'Organisations-Administratoren haben eingeschränkten Zugriff'
  description: 'Administratoren der Organisation, der diese Veranstaltung gehört, haben immer den folgenden Zugriff, auch ohne als Mitglied aufgeführt zu sein. Er kann hier nicht entzogen werden.'
  limit: 'Sie können niemals Anmeldungen, Teilnehmer oder deren personenbezogene Daten einsehen.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Permissions par rôle'
close: 'Fermer'

role:
  coordinator: 'Coordinateur'
  counselor: 'Conseiller'
  director: 'Directeur'
  viewer: 'Lecteur'

permissions:
  group:
    event: "Paramètres de l'événement"

    files: 'Fichiers'
    registrations: 'Inscriptions'
    managers: 'Accès équipe'
    messages: 'Messages'
    message_templates: 'Modèles de messages'
    table_templates: 'Modèles de tableaux'
    rooms: 'Chambres'
    beds: 'Lits'
    program: 'Programme'
    tasks: 'Tâches'
    chores: 'Corvées'
    chore_assignments: 'Plan des corvées'
  action:
    view: 'Voir'
    create: 'Créer'
    edit: 'Modifier'
    delete: 'Supprimer'

organization:
  title: "Les administrateurs de l'organisation ont un accès partiel"
  description: "Les administrateurs de l'organisation propriétaire de cet événement disposent toujours des accès suivants, même sans figurer parmi les membres. Ils ne peuvent pas être retirés ici."
  limit: 'Ils ne peuvent jamais consulter les inscriptions, les participants ni leurs données personnelles.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Uprawnienia ról'
close: 'Zamknij'

role:
  coordinator: 'Koordynator'
  counselor: 'Opiekun'
  director: 'Kierownik'
  viewer: 'Podglądający'

permissions:
  group:
    event: 'Ustawienia wydarzenia'
    files: 'Pliki'
    registrations: 'Rejestracje'
    managers: 'Dostęp zespołu'
    messages: 'Wiadomości'
    message_templates: 'Szablony wiadomości'
    table_templates: 'Szablony tabel'
    rooms: 'Pokoje'
    beds: 'Łóżka'
    program: 'Program'
    tasks: 'Zadania'
    chores: 'Obowiązki'
    chore_assignments: 'Grafik dyżurów'
  action:
    view: 'Podgląd'
    create: 'Tworzenie'
    edit: 'Edycja'
    delete: 'Usuwanie'

organization:
  title: 'Administratorzy organizacji mają częściowy dostęp'
  description: 'Administratorzy organizacji będącej właścicielem tego wydarzenia zawsze mają poniższy dostęp, nawet jeśli nie są wymienieni jako członkowie. Nie można go tutaj odebrać.'
  limit: 'Nigdy nie mogą zobaczyć rejestracji, uczestników ani ich danych osobowych.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Oprávnění rolí'
close: 'Zavřít'

role:
  coordinator: 'Koordinátor'
  counselor: 'Vedoucí'
  director: 'Ředitel'
  viewer: 'Pozorovatel'

permissions:
  group:
    event: 'Nastavení akce'
    files: 'Soubory'
    registrations: 'Registrace'
    managers: 'Přístup týmu'
    messages: 'Zprávy'
    message_templates: 'Šablony zpráv'
    table_templates: 'Šablony tabulek'
    rooms: 'Pokoje'
    beds: 'Lůžka'
    program: 'Program'
    tasks: 'Úkoly'
    chores: 'Povinnosti'
    chore_assignments: 'Rozpis služeb'
  action:
    view: 'Zobrazit'
    create: 'Vytvořit'
    edit: 'Upravit'
    delete: 'Smazat'

organization:
  title: 'Správci organizace mají částečný přístup'
  description: 'Správci organizace, která vlastní tuto akci, mají vždy následující přístup, i když nejsou uvedeni jako členové. Zde jej nelze odebrat.'
  limit: 'Nikdy nemohou vidět registrace, účastníky ani jejich osobní údaje.'
</i18n>

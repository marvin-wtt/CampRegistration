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
        <div class="pm-wrap">
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
                v-for="role in ROLES"
                :key="role"
                class="pm-role-col pm-role-head"
                role="columnheader"
              >
                <span
                  class="md3-chip role-chip"
                  :class="roleClass(role)"
                >
                  {{ t('role.' + role.toLowerCase()) }}
                </span>
              </div>
            </div>

            <!-- Feature rows -->
            <div
              v-for="group in permissionGroups"
              :key="group.key"
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
                    :name="group.icon"
                    size="18px"
                  />
                </q-avatar>
                <span class="pm-feature-label">
                  {{ t('permissions.group.' + group.key) }}
                </span>
              </div>

              <div
                v-for="role in ROLES"
                :key="role"
                class="pm-role-col"
                :data-role="t('role.' + role.toLowerCase())"
                role="cell"
              >
                <div
                  v-if="group.actions[role].length"
                  class="pm-actions"
                >
                  <q-chip
                    v-for="action in group.actions[role]"
                    :key="action"
                    dense
                    class="pm-action-chip"
                    :icon="actionIcon(action)"
                    :label="t('permissions.action.' + action)"
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
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const { t } = useI18n();

const ROLES = ['DIRECTOR', 'COORDINATOR', 'COUNSELOR', 'VIEWER'] as const;
type Role = (typeof ROLES)[number];

interface PermissionGroup {
  key: string;
  icon: string;
  actions: Record<Role, string[]>;
}

const permissionGroups: PermissionGroup[] = [
  {
    key: 'camp',
    icon: 'tune',
    actions: {
      DIRECTOR: ['view', 'edit', 'delete'],
      COORDINATOR: ['view', 'edit'],
      COUNSELOR: ['view'],
      VIEWER: ['view'],
    },
  },
  {
    key: 'files',
    icon: 'folder_open',
    actions: {
      DIRECTOR: ['view', 'create', 'edit', 'delete'],
      COORDINATOR: ['view', 'create', 'edit', 'delete'],
      COUNSELOR: ['view'],
      VIEWER: ['view'],
    },
  },
  {
    key: 'registrations',
    icon: 'how_to_reg',
    actions: {
      DIRECTOR: ['view', 'edit', 'delete'],
      COORDINATOR: ['view', 'edit', 'delete'],
      COUNSELOR: ['view'],
      VIEWER: ['view'],
    },
  },
  {
    key: 'managers',
    icon: 'manage_accounts',
    actions: {
      DIRECTOR: ['view', 'create', 'edit', 'delete'],
      COORDINATOR: ['view'],
      COUNSELOR: ['view'],
      VIEWER: [],
    },
  },
  {
    key: 'messages',
    icon: 'mail',
    actions: {
      DIRECTOR: ['view', 'create', 'delete'],
      COORDINATOR: ['view', 'create', 'delete'],
      COUNSELOR: [],
      VIEWER: [],
    },
  },
  {
    key: 'message_templates',
    icon: 'mark_email_read',
    actions: {
      DIRECTOR: ['view', 'create', 'edit', 'delete'],
      COORDINATOR: ['view', 'create', 'edit', 'delete'],
      COUNSELOR: ['view'],
      VIEWER: [],
    },
  },
  {
    key: 'table_templates',
    icon: 'table_chart',
    actions: {
      DIRECTOR: ['view', 'create', 'edit', 'delete'],
      COORDINATOR: ['view', 'create', 'edit', 'delete'],
      COUNSELOR: ['view'],
      VIEWER: ['view'],
    },
  },
  {
    key: 'rooms',
    icon: 'meeting_room',
    actions: {
      DIRECTOR: ['view', 'create', 'edit', 'delete'],
      COORDINATOR: ['view', 'create', 'edit', 'delete'],
      COUNSELOR: ['view'],
      VIEWER: ['view'],
    },
  },
  {
    key: 'beds',
    icon: 'bed',
    actions: {
      DIRECTOR: ['create', 'edit', 'delete'],
      COORDINATOR: ['create', 'edit', 'delete'],
      COUNSELOR: ['edit'],
      VIEWER: [],
    },
  },
  {
    key: 'program',
    icon: 'event_note',
    actions: {
      DIRECTOR: ['view', 'create', 'edit', 'delete'],
      COORDINATOR: ['view', 'create', 'edit', 'delete'],
      COUNSELOR: ['view'],
      VIEWER: ['view'],
    },
  },
];

const roleOrder = ['director', 'coordinator', 'counselor', 'viewer'];

function roleClass(role: string): string {
  const normalized = role.toLowerCase();
  return `role--${roleOrder.includes(normalized) ? normalized : 'viewer'}`;
}

function actionIcon(action: string): string {
  const icons: Record<string, string> = {
    view: 'visibility',
    create: 'add_circle',
    edit: 'edit',
    delete: 'delete',
  };
  return icons[action] ?? 'circle';
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
    camp: 'Camp settings'
    files: 'Files'
    registrations: 'Registrations'
    managers: 'Team access'
    messages: 'Messages'
    message_templates: 'Message templates'
    table_templates: 'Table templates'
    rooms: 'Rooms'
    beds: 'Beds'
    program: 'Program'
  action:
    view: 'View'
    create: 'Create'
    edit: 'Edit'
    delete: 'Delete'
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
    camp: 'Camp-Einstellungen'
    files: 'Dateien'
    registrations: 'Anmeldungen'
    managers: 'Team-Zugriff'
    messages: 'Nachrichten'
    message_templates: 'Nachrichtenvorlagen'
    table_templates: 'Tabellenvorlagen'
    rooms: 'Räume'
    beds: 'Betten'
    program: 'Programm'
  action:
    view: 'Anzeigen'
    create: 'Erstellen'
    edit: 'Bearbeiten'
    delete: 'Löschen'
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
    camp: 'Paramètres du camp'
    files: 'Fichiers'
    registrations: 'Inscriptions'
    managers: 'Accès équipe'
    messages: 'Messages'
    message_templates: 'Modèles de messages'
    table_templates: 'Modèles de tableaux'
    rooms: 'Chambres'
    beds: 'Lits'
    program: 'Programme'
  action:
    view: 'Voir'
    create: 'Créer'
    edit: 'Modifier'
    delete: 'Supprimer'
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
    camp: 'Ustawienia obozu'
    files: 'Pliki'
    registrations: 'Rejestracje'
    managers: 'Dostęp zespołu'
    messages: 'Wiadomości'
    message_templates: 'Szablony wiadomości'
    table_templates: 'Szablony tabel'
    rooms: 'Pokoje'
    beds: 'Łóżka'
    program: 'Program'
  action:
    view: 'Podgląd'
    create: 'Tworzenie'
    edit: 'Edycja'
    delete: 'Usuwanie'
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
    camp: 'Nastavení tábora'
    files: 'Soubory'
    registrations: 'Registrace'
    managers: 'Přístup týmu'
    messages: 'Zprávy'
    message_templates: 'Šablony zpráv'
    table_templates: 'Šablony tabulek'
    rooms: 'Pokoje'
    beds: 'Lůžka'
    program: 'Program'
  action:
    view: 'Zobrazit'
    create: 'Vytvořit'
    edit: 'Upravit'
    delete: 'Smazat'
</i18n>

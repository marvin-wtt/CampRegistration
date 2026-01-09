<template>
  <q-menu>
    <q-list style="min-width: 100px">
      <q-item
        v-if="active"
        v-close-popup
        clickable
        @click="emit('share')"
      >
        <q-item-section avatar>
          <q-icon name="share" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.share') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        v-if="!active && can('camp.edit')"
        v-close-popup
        v-ripple
        class="text-warning"
        clickable
        @click="emit('enable')"
      >
        <q-item-section avatar>
          <q-icon name="publish" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.enable') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        v-if="can('camp.edit')"
        v-close-popup
        clickable
        @click="emit('edit')"
      >
        <q-item-section avatar>
          <q-icon name="edit" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.edit') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        v-if="active && can('camp.edit')"
        v-close-popup
        v-ripple
        class="text-warning"
        clickable
        @click="emit('disable')"
      >
        <q-item-section avatar>
          <q-icon name="unpublished" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.disable') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        v-if="!camp.active && can('camp.delete')"
        v-close-popup
        class="text-negative"
        clickable
        @click="emit('delete')"
      >
        <q-item-section avatar>
          <q-icon name="delete" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.delete') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
<script lang="ts" setup>
import type { Camp } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { usePermissions } from 'src/composables/permissions';

const { t } = useI18n();
const { canFor } = usePermissions();

const { camp, active = false } = defineProps<{
  camp: Camp;
  active?: boolean;
}>();

const emit = defineEmits<{
  (e: 'share'): void;
  (e: 'edit'): void;
  (e: 'enable'): void;
  (e: 'disable'): void;
  (e: 'delete'): void;
}>();

type Tail<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : [];

function can(...permissions: Tail<Parameters<typeof canFor>>): boolean {
  return canFor(camp.id, ...permissions);
}
</script>

<i18n lang="yaml" locale="en">
action:
  create: 'Create new'
  delete: 'Delete'
  edit: 'Edit'
  enable: 'Enable'
  share: 'Share'
  disable: 'Disable'
</i18n>

<i18n lang="yaml" locale="de">
action:
  create: 'Neu erstellen'
  delete: 'Löschen'
  edit: 'Bearbeiten'
  enable: 'Aktivieren'
  share: 'Teilen'
  disable: 'Deaktivieren'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  create: 'Créer'
  delete: 'Supprimer'
  edit: 'Éditer'
  enable: 'Activer'
  share: 'Partager'
  disable: 'Désactiver'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  create: 'Utwórz nowe'
  delete: 'Usuń'
  edit: 'Edytuj'
  enable: 'Aktywuj'
  share: 'Udostępnij'
  disable: 'Dezaktywuj'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  create: 'Vytvořit nový'
  delete: 'Smazat'
  edit: 'Upravit'
  enable: 'Aktivovat'
  share: 'Sdílet'
  disable: 'Deaktivovat'
</i18n>

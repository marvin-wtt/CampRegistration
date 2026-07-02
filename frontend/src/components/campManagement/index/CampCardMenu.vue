<template>
  <q-menu>
    <q-list style="min-width: 100px">
      <q-item
        v-close-popup
        :disable="!active"
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
        <q-tooltip v-if="!active">
          {{ t('tooltip.share_disabled') }}
        </q-tooltip>
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
        v-if="can('camp.delete')"
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
import { usePermissions } from '@/composables/permissions';

const { t } = useI18n();
const { canFor } = usePermissions();

const { camp, active = false } = defineProps<{
  camp: Camp;
  active?: boolean;
}>();

const emit = defineEmits<{
  (e: 'share'): void;
  (e: 'edit'): void;
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
tooltip:
  share_disabled: 'Sharing is only available while registration is open'
</i18n>

<i18n lang="yaml" locale="de">
action:
  create: 'Neu erstellen'
  delete: 'Löschen'
  edit: 'Bearbeiten'
  enable: 'Aktivieren'
  share: 'Teilen'
  disable: 'Deaktivieren'
tooltip:
  share_disabled: 'Teilen ist nur möglich, während die Anmeldung geöffnet ist'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  create: 'Créer'
  delete: 'Supprimer'
  edit: 'Éditer'
  enable: 'Activer'
  share: 'Partager'
  disable: 'Désactiver'
tooltip:
  share_disabled: "Le partage n'est disponible que lorsque les inscriptions sont ouvertes"
</i18n>

<i18n lang="yaml" locale="pl">
action:
  create: 'Utwórz nowe'
  delete: 'Usuń'
  edit: 'Edytuj'
  enable: 'Aktywuj'
  share: 'Udostępnij'
  disable: 'Dezaktywuj'
tooltip:
  share_disabled: 'Udostępnianie jest dostępne tylko podczas otwartej rejestracji'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  create: 'Vytvořit nový'
  delete: 'Smazat'
  edit: 'Upravit'
  enable: 'Aktivovat'
  share: 'Sdílet'
  disable: 'Deaktivovat'
tooltip:
  share_disabled: 'Sdílení je dostupné pouze během otevřené registrace'
</i18n>

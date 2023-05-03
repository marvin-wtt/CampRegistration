<template>
  <q-btn-dropdown
    split
    v-bind="$attrs"
    @click="addSingleRoom"
  >
    <q-list>
      <!-- Single -->
      <q-item
        v-close-popup
        clickable
        @click="addSingleRoom"
      >
        <q-item-section>
          <q-item-label>
            {{ t('single') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <!-- Multiple -->
      <q-item
        v-close-popup
        clickable
        @click="addMultipleRooms"
      >
        <q-item-section>
          <q-item-label>
            {{ t('multiple') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'add-multiple'): void;
}>();

function addSingleRoom() {
  emit('add');
}

function addMultipleRooms() {
  emit('add-multiple');
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
single: 'Add single room'
multiple: 'Add multiple rooms'
</i18n>

<i18n lang="yaml" locale="de">
single: 'Ein Zimmer hinzufügen'
multiple: 'Mehrere Zimmer hinzufügen'
</i18n>

<i18n lang="yaml" locale="fr">
single: 'Ajouter une chambre'
multiple: 'Ajouter plusieurs chambres'
</i18n>

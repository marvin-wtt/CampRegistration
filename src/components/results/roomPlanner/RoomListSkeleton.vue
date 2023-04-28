<template>
  <q-list
    bordered
    padding
  >
    <q-item dense>
      <q-item-section>
        <q-item-label>
          <q-skeleton
            type="text"
            width="8rem"
          />
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <q-btn
          flat
          rounded
          dense
          disable
          icon="more_vert"
        />
      </q-item-section>
    </q-item>

    <room-list-item-skeleton
      v-for="index in props.capacity"
      :key="index"
      :options="options"
      :position="index + 1"
    />
  </q-list>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import RoomListItemSkeleton from 'components/results/roomPlanner/RoomListItemSkeleton.vue';

interface Props {
  capacity: number;
}

const props = defineProps<Props>();

const options = computed<unknown[]>(() => {
  return [];
});
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
menu:
  edit: 'Edit'
  delete: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
menu:
  edit: 'Bearbeiten'
  delete: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
menu:
  edit: 'Modifier'
  delete: 'Supprimer'
</i18n>

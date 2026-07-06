<template>
  <div class="room-card-skeleton">
    <div class="room-card-skeleton__header">
      <q-skeleton
        type="text"
        width="7rem"
        class="room-card-skeleton__name"
      />
      <q-skeleton
        type="QChip"
        width="40px"
        height="20px"
      />
    </div>

    <q-skeleton
      type="rect"
      height="4px"
      class="room-card-skeleton__meter"
    />

    <div class="room-card-skeleton__beds">
      <room-list-item-skeleton
        v-for="index in capacity"
        :key="index"
        :name-width="`${45 + ((index * 17) % 35)}%`"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import RoomListItemSkeleton from '@/components/campManagement/roomPlanner/RoomListItemSkeleton.vue';

const { capacity } = defineProps<{
  capacity: number;
}>();
</script>

<style scoped>
.room-card-skeleton {
  border: 1px solid var(--md3-outline-variant);
  border-radius: 16px;

  background: var(--md3-surface);
}

.room-card-skeleton__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  padding: 12px 16px 10px;
}

.room-card-skeleton__name {
  font-size: 15px;
}

.room-card-skeleton__meter {
  margin: 0 16px;
  border-radius: 999px;
}

.room-card-skeleton__beds {
  display: flex;
  flex-direction: column;
  gap: 4px;

  padding: 12px;
}
</style>

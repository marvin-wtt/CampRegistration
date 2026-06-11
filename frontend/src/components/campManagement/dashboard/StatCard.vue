<template>
  <q-card
    flat
    bordered
    class="full-height stat-card"
  >
    <q-card-section class="row items-center no-wrap q-gutter-md">
      <div
        class="stat-icon row items-center justify-center"
        :class="`text-${color}`"
      >
        <q-icon
          :name="icon"
          size="24px"
        />
      </div>
      <div class="col">
        <div class="text-caption text-grey-7 ellipsis">{{ label }}</div>
        <div class="text-h5 text-weight-bold">{{ value }}</div>
        <div
          v-if="caption"
          class="text-caption text-grey-6 ellipsis"
        >
          {{ caption }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
defineProps<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
  caption?: string | undefined;
}>();
</script>

<style scoped>
.stat-card {
  overflow: hidden;
  border-radius: 16px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 22px rgba(38, 50, 56, 0.09);
  transform: translateY(-2px);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex: 0 0 auto;
  background: rgba(127, 127, 127, 0.1);
}

:global(.body--dark) .stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

@media (max-width: 599px) {
  .stat-card .q-card__section {
    align-items: flex-start;
    padding: 14px;
    gap: 10px;
  }

  .stat-icon {
    width: 38px;
    height: 38px;
  }
}
</style>

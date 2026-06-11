<template>
  <q-card
    flat
    bordered
    class="rounded-borders full-height"
  >
    <q-card-section class="row items-center no-wrap q-gutter-sm">
      <q-avatar
        :color="color"
        text-color="white"
        :icon="icon"
      />
      <div class="col">
        <div class="text-caption text-grey-7 ellipsis">{{ label }}</div>
        <div class="text-h5 text-weight-medium">{{ value }}</div>
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

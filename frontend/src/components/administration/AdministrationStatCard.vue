<template>
  <div class="col-12 col-sm-6 col-md-3">
    <q-card
      flat
      bordered
      class="stat-card"
      :class="{ clickable: to }"
      @click="navigate"
    >
      <div class="row items-center no-wrap q-gutter-x-md">
        <q-avatar
          :color="color"
          text-color="white"
          :icon="icon"
        />
        <div class="column">
          <div class="text-h4 text-weight-medium">{{ value }}</div>
          <div class="text-caption text-on-surface-variant">
            {{ label }}
          </div>
        </div>
      </div>
    </q-card>
  </div>
</template>

<script lang="ts" setup>
import { type RouteLocationRaw, useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
  to?: RouteLocationRaw | undefined;
}>();

function navigate() {
  if (!props.to) {
    return;
  }

  void router.push(props.to);
}
</script>

<style scoped>
.stat-card {
  padding: 16px;
  border-radius: 16px;
  height: 100%;
  background: var(--md3-surface-container-low);
}

.stat-card.clickable {
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.stat-card.clickable:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
</style>

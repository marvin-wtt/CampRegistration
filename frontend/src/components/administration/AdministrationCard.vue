<template>
  <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3">
    <q-card
      v-ripple
      class="card column justify-center items-center cursor-pointer q-hoverable"
      bordered
      flat
      @click="navigate"
    >
      <span class="q-focus-helper"></span>
      <slot name="header">
        <q-card-section class="column items-center q-gutter-y-sm">
          <q-icon
            v-if="props.icon"
            :name="props.icon"
            size="3rem"
            color="primary"
          />
          <div class="text-h6 text-weight-medium text-center">
            {{ props.label }}
          </div>
        </q-card-section>
      </slot>

      <div
        v-if="slots.default"
        class="full-width"
      >
        <q-separator
          class="self-center"
          inset
        />
      </div>

      <slot name="default" />
    </q-card>
  </div>
</template>

<script lang="ts" setup>
import { type RouteLocationRaw, useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps<{
  label: string;
  icon?: string;
  to?: RouteLocationRaw;
}>();

const slots = defineSlots<{
  header?: () => unknown;
  default?: () => unknown;
}>();

function navigate() {
  if (!props.to) {
    return;
  }

  void router.push(props.to);
}
</script>

<style scoped>
.card {
  min-height: 140px;
  border-radius: 16px;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
}
</style>

<template>
  <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
    <q-card
      v-ripple
      class="card column justify-center items-center cursor-pointer q-hoverable"
      bordered
      @click="navigate"
    >
      <span class="q-focus-helper"></span>
      <slot name="header">
        <q-card-section>
          <div
            class="text-center"
            :class="headerFontSize"
          >
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

      <slot name="default"> </slot>
    </q-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { type RouteLocationRaw, useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps<{
  label: string;
  to?: RouteLocationRaw;
}>();

const slots = defineSlots<{
  header?: () => unknown;
  default?: () => unknown;
}>();

const headerFontSize = computed<string>(() => {
  return slots.default ? 'text-h5' : 'text-h4';
});

function navigate() {
  if (!props.to) {
    return;
  }

  void router.push(props.to);
}
</script>

<style scoped>
.card {
  aspect-ratio: 2;
  border-radius: 20px;
}
</style>

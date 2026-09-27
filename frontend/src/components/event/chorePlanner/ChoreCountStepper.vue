<template>
  <!-- Easier on a phone than typing into a number field. -->
  <div
    class="stepper row items-center no-wrap rounded-full"
    role="group"
    :aria-label="label"
  >
    <q-btn
      icon="remove"
      flat
      round
      color="primary"
      :disable="model <= min"
      :aria-label="t('decrease', { label })"
      @click="model = Math.max(model - 1, min)"
    />
    <span class="value text-subtitle1 text-weight-medium text-center">
      {{ model }}
    </span>
    <q-btn
      icon="add"
      flat
      round
      color="primary"
      :aria-label="t('increase', { label })"
      @click="model = model + 1"
    />
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    label: string;
    min?: number;
  }>(),
  { min: 0 },
);

const model = defineModel<number>({ required: true });

const { t } = useI18n();
</script>

<style scoped>
.stepper {
  border: 1px solid var(--md3-outline-variant);
}

.value {
  min-width: 2ch;
}
</style>

<i18n lang="yaml" locale="en">
decrease: 'Fewer: {label}'
increase: 'More: {label}'
</i18n>

<i18n lang="yaml" locale="de">
decrease: 'Weniger: {label}'
increase: 'Mehr: {label}'
</i18n>

<i18n lang="yaml" locale="fr">
decrease: 'Moins : {label}'
increase: 'Plus : {label}'
</i18n>

<i18n lang="yaml" locale="pl">
decrease: 'Mniej: {label}'
increase: 'Więcej: {label}'
</i18n>

<i18n lang="yaml" locale="cs">
decrease: 'Méně: {label}'
increase: 'Více: {label}'
</i18n>

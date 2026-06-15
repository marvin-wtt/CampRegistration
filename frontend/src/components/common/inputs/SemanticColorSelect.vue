<template>
  <q-select
    v-model="model"
    :label="label"
    :options="options"
    emit-value
    map-options
    outlined
    rounded
    dense
  >
    <template #prepend>
      <q-icon
        v-if="model"
        name="circle"
        :color="model"
      />
    </template>

    <template #selected-item="scope">
      {{ scope.opt.label }}
    </template>

    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-icon
            name="circle"
            :color="scope.opt.value"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QSelectOption } from 'quasar';

defineProps<{
  label?: string | undefined;
}>();

const model = defineModel<string | undefined>();

const { t } = useI18n();

// Semantic Quasar color tokens. These resolve through CSS variables and adapt
// to light/dark mode automatically, so no per-mode value needs to be stored.
const TOKENS = [
  'positive',
  'negative',
  'warning',
  'info',
  'primary',
  'grey',
] as const;

const options = computed<QSelectOption[]>(() => {
  return TOKENS.map((token) => ({
    label: t(`color.${token}`),
    value: token,
  }));
});
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
color:
  positive: 'Success'
  negative: 'Error'
  warning: 'Warning'
  info: 'Info'
  primary: 'Primary'
  grey: 'Neutral'
</i18n>

<i18n lang="yaml" locale="de">
color:
  positive: 'Erfolg'
  negative: 'Fehler'
  warning: 'Warnung'
  info: 'Info'
  primary: 'Primär'
  grey: 'Neutral'
</i18n>

<i18n lang="yaml" locale="fr">
color:
  positive: 'Succès'
  negative: 'Erreur'
  warning: 'Avertissement'
  info: 'Info'
  primary: 'Principal'
  grey: 'Neutre'
</i18n>

<i18n lang="yaml" locale="pl">
color:
  positive: 'Sukces'
  negative: 'Błąd'
  warning: 'Ostrzeżenie'
  info: 'Informacja'
  primary: 'Główny'
  grey: 'Neutralny'
</i18n>

<i18n lang="yaml" locale="cs">
color:
  positive: 'Úspěch'
  negative: 'Chyba'
  warning: 'Varování'
  info: 'Info'
  primary: 'Primární'
  grey: 'Neutrální'
</i18n>

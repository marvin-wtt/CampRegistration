<template>
  <q-btn
    :icon
    :aria-label="label"
    round
    outline
    @click="model = !model"
  >
    <q-tooltip>
      {{ label }}
    </q-tooltip>
  </q-btn>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();

const model = defineModel<boolean>({
  required: true,
});

const label = computed<string>(() => {
  return model.value ? t('actions.disable') : t('actions.enable');
});

const icon = computed<string>(() => {
  return model.value ? 'unfold_less' : 'translate';
});
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
actions:
  enable: 'Use translations'
  disable: "Don't use translations"
</i18n>

<i18n lang="yaml" locale="de">
actions:
  enable: 'Übersetzungen verwenden'
  disable: 'Keine Übersetzungen verwenden'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  enable: 'Utiliser les traductions'
  disable: 'Ne pas utiliser les traductions'
</i18n>

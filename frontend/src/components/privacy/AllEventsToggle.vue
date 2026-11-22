<template>
  <!-- Whether events may drop this organization entry. A lock beside the row
       instead of a sentence-long checkbox under it: the question is the same
       for every entry, so the explanation lives in the tooltip. -->
  <m-btn
    flat
    round
    dense
    size="sm"
    :icon="modelValue ? 'lock' : 'lock_open'"
    :color="modelValue ? 'primary' : undefined"
    :class="{ 'text-on-surface-variant': !modelValue }"
    :disable
    :aria-label="modelValue ? t('on') : t('off')"
    :aria-pressed="modelValue"
    @click="emit('update:modelValue', !modelValue)"
  >
    <q-tooltip max-width="18rem">
      {{ modelValue ? t('on') : t('off') }}
    </q-tooltip>
  </m-btn>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

defineProps<{
  modelValue: boolean;
  disable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();
</script>

<i18n lang="yaml" locale="en">
on: 'Applies to every event — events cannot exclude it.'
off: 'Events may exclude it. Lock it to apply it to every event.'
</i18n>

<i18n lang="yaml" locale="de">
on: 'Gilt für alle Veranstaltungen – Veranstaltungen können es nicht ausschließen.'
off: 'Veranstaltungen können es ausschließen. Sperren, damit es für alle Veranstaltungen gilt.'
</i18n>

<i18n lang="yaml" locale="fr">
on: 'S’applique à tous les événements – ils ne peuvent pas l’exclure.'
off: 'Les événements peuvent l’exclure. Verrouille-le pour l’appliquer à tous.'
</i18n>

<i18n lang="yaml" locale="pl">
on: 'Dotyczy wszystkich wydarzeń – wydarzenia nie mogą tego wykluczyć.'
off: 'Wydarzenia mogą to wykluczyć. Zablokuj, aby dotyczyło wszystkich wydarzeń.'
</i18n>

<i18n lang="yaml" locale="cs">
on: 'Platí pro všechny akce – akce to nemohou vyloučit.'
off: 'Akce to mohou vyloučit. Zamkni, aby to platilo pro všechny akce.'
</i18n>

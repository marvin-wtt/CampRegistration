<template>
  <q-input
    v-model="text"
    type="textarea"
    :error="error !== null"
    :error-message="error ?? undefined"
    v-bind="$attrs"
    @blur="format"
  >
    <template
      v-for="(data, name, index) in $slots as unknown as QInputSlots"
      :key="index"
      #[name]
    >
      <slot
        :name="name"
        v-bind="data"
      />
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { type QInputSlots } from 'quasar';
import { useI18n } from 'vue-i18n';

defineOptions({
  inheritAttrs: false,
});

const model = defineModel<object | undefined>();

const { t } = useI18n();

const text = ref<string>(stringify(model.value));
const error = ref<string | null>(null);

function stringify(value: unknown): string {
  if (value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

watch(text, (value) => {
  const trimmed = value.trim();

  if (trimmed === '') {
    error.value = null;
    model.value = undefined;
    return;
  }

  try {
    model.value = JSON.parse(trimmed);
    error.value = null;
  } catch {
    // Keep the invalid text so the user can fix it; just surface the error
    //  and stop propagating a broken value to the parent.
    error.value = t('error.invalid');
  }
});

// Re-sync when the value is changed from the outside, but skip self-inflicted
//  updates so the user's caret and partial edits are preserved while typing.
watch(model, (value) => {
  if (error.value !== null) {
    return;
  }

  const current = text.value.trim() === '' ? undefined : safeParse(text.value);
  if (JSON.stringify(current) === JSON.stringify(value)) {
    return;
  }

  text.value = stringify(value);
});

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// Pretty-print valid JSON when the field loses focus.
function format() {
  if (error.value !== null) {
    return;
  }

  text.value = stringify(model.value);
}
</script>

<i18n lang="yaml" locale="en">
error:
  invalid: 'Invalid JSON'
</i18n>

<i18n lang="yaml" locale="de">
error:
  invalid: 'Ungültiges JSON'
</i18n>

<i18n lang="yaml" locale="fr">
error:
  invalid: 'JSON invalide'
</i18n>

<i18n lang="yaml" locale="cs">
error:
  invalid: 'Neplatný JSON'
</i18n>

<i18n lang="yaml" locale="pl">
error:
  invalid: 'Nieprawidłowy JSON'
</i18n>

<template>
  <!-- A category or group name, typed in place: new, or a rename. Checked
       on save only, so an untouched field shows no error. -->
  <q-form
    class="row items-start no-wrap q-gutter-x-xs"
    @submit.prevent="submit"
  >
    <translated-input
      v-model="name"
      :label
      :locales
      :rules="[(val: unknown) => !!val || t('finance.validation.name')]"
      lazy-rules="ondemand"
      class="col"
      autofocus
      dense
      outlined
      rounded
      hide-bottom-space
      @keydown.esc="emit('cancel')"
    />
    <m-btn
      icon="check"
      type="submit"
      flat
      round
      color="primary"
      :loading="saving"
      :aria-label="t('finance.action.save')"
    />
    <m-btn
      icon="close"
      flat
      round
      color="on-surface-variant"
      :aria-label="t('finance.action.cancel')"
      @click="emit('cancel')"
    />
  </q-form>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';

type Name = string | Record<string, string>;

const {
  label,
  locales,
  initial = undefined,
  save,
} = defineProps<{
  label: string;
  locales: string[];
  /** The current name, when renaming. */
  initial?: Name | undefined;
  /** Stores the name; the form closes once it resolves. */
  save: (name: Name) => Promise<unknown>;
}>();

const emit = defineEmits<{ cancel: []; saved: [] }>();

const { t } = useI18n();

const name = ref<Name | undefined>(
  typeof initial === 'object' ? { ...initial } : initial,
);
const saving = ref(false);

async function submit() {
  if (!name.value) {
    return;
  }
  saving.value = true;
  try {
    await save(name.value);
    emit('saved');
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>

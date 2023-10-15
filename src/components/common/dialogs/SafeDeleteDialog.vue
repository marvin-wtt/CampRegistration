<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">
          {{ props.title }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ props.message }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ t('text.confirm', { label: props.label }) }}
      </q-card-section>

      <q-card-section class="q-pt-none text-center text-bold">
        {{ props.value }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="modelValue"
          :label="props.label"
          autofocus
          rounded
          outlined
          @keyup.enter="prompt = false"
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="text-primary"
      >
        <q-btn
          :label="t('action.cancel')"
          flat
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          :disable="confirmDeleteDisabled"
          :label="t('action.delete')"
          color="negative"
          rounded
          @click="onDialogOK"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

interface Props {
  title: string;
  message: string;
  value: string;
  label: string;
}

const props = defineProps<Props>();
defineEmits([...useDialogPluginComponent.emits]);

const modelValue = ref<string>('');

const confirmDeleteDisabled = computed<boolean>(() => {
  return (
    modelValue.value.trim().toLowerCase() !==
    props.value.trim().toLocaleLowerCase()
  );
});
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
text:
  confirm: 'Please enter the {label} to confirm:'

action:
  delete: 'Delete'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
text:
  confirm: 'Bitte zur Bestätigung {label} eingeben:'

action:
  delete: 'Löschen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
text:
  confirm: 'Veuillez entrer {label} pour confirmer :'

action:
  delete: 'Supprimer'
  cancel: 'Annuler'
</i18n>

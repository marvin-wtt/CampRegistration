<template>
  <!-- Irreversible deletions: typing the name is the confirmation. A bottom
       sheet on phones, like the other dialogs. Explanations belong on the page
       that opens it; this only confirms. -->
  <responsive-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <dialog-card
      :title
      icon="delete_forever"
      :width="480"
      no-form
      @cancel="onDialogCancel"
    >
      <div class="column confirm-body">
        <p
          v-if="message"
          class="text-body2 q-my-none"
          data-testid="message"
        >
          {{ message }}
        </p>

        <div>
          <div class="text-body2">{{ t('text.confirm', { label }) }}</div>
          <div
            class="text-body1 text-weight-bold data-value q-mt-xs"
            data-testid="value"
          >
            {{ value }}
          </div>
        </div>

        <q-input
          v-model="modelValue"
          :label="formattedLabel"
          autofocus
          rounded
          outlined
          data-testid="input"
          @keyup.enter="submit"
        />
      </div>

      <template #actions>
        <q-btn
          :label="t('action.cancel')"
          outline
          rounded
          color="primary"
          data-testid="cancel"
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.delete')"
          :disable="confirmDeleteDisabled"
          unelevated
          rounded
          color="negative"
          data-testid="submit"
          @click="submit"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const { title, message, value, label } = defineProps<{
  title: string;
  /** Short: what happens belongs on the page that opens the dialog. */
  message?: string | undefined;
  value: string;
  label: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const modelValue = ref<string>('');

const confirmDeleteDisabled = computed<boolean>(() => {
  return (
    modelValue.value.trim().toLowerCase() !== value.trim().toLocaleLowerCase()
  );
});

function submit() {
  if (!confirmDeleteDisabled.value) {
    onDialogOK();
  }
}

const formattedLabel = computed<string>(() => {
  if (label.length > 0) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return '';
});
</script>

<style scoped>
.confirm-body {
  /* A gap, not q-gutter: its negative margin is clipped by the scroll body. */
  gap: 16px;
}

.data-value {
  /* Ensure that multiple spaces are shown correctly */
  white-space: pre-wrap;
}
</style>

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

<i18n lang="yaml" locale="pl">
text:
  confirm: 'Aby potwierdzić, wpisz {label}:'

action:
  delete: 'Usuń'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
text:
  confirm: 'Pro potvrzení zadejte {label}:'

action:
  delete: 'Smazat'
  cancel: 'Zrušit'
</i18n>

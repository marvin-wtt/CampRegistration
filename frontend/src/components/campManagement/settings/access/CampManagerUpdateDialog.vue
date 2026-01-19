<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form
        @submit="onInvite"
        @reset="onDialogCancel"
      >
        <q-card-section class="text-h6">
          {{ t('title') }}
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-md">
          <q-select
            v-model="data.role"
            :label="t('input.role.label')"
            :options="roles"
            map-options
            emit-value
            :rules="[(val?: string) => !!val || t('input.role.rule.required')]"
            hide-bottom-space
            rounded
            outlined
          />

          <date-time-input
            v-model="data.expiresAt"
            :label="t('input.expiresAt')"
            clearable
          />
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            :label="t('action.cancel')"
            type="reset"
            flat
            outline
            rounded
          />
          <q-btn
            :label="t('action.update')"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive } from 'vue';
import DateTimeInput from 'components/common/inputs/DateTimeInput.vue';
import type {
  CampManager,
  CampManagerUpdateData,
} from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const { manager, roles } = defineProps<{
  manager: CampManager;
  roles: QSelectOption[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<CampManagerUpdateData>({
  expiresAt: manager.expiresAt,
  role: manager.role,
});

function onInvite() {
  onDialogOK(data);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Update Access'

input:
  role:
    label: 'Role'
    rule:
      required: 'The role is required'
  expiresAt: 'Expiration Date'

action:
  cancel: 'Cancel'
  update: 'Update'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zugriff gewähren'

input:
  role:
    label: 'Rolle'
    rule:
      required: 'Die Rolle ist erforderlich'
  expiresAt: 'Ablaufdatum'

action:
  cancel: 'Abbrechen'
  update: 'Aktialisieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Accorder l’accès'

input:
  role:
    label: 'Rôle'
    rule:
      required: 'Le rôle est requis'
  expiresAt: 'Date d’expiration'

action:
  cancel: 'Annuler'
  update: 'Actualiser'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Przyznaj dostęp'

input:
  role:
    label: 'Rola'
    rule:
      required: 'Rola jest wymagana'
  expiresAt: 'Data wygaśnięcia'

action:
  cancel: 'Anuluj'
  update: 'Zaktualizuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Udělte přístup'

input:
  role:
    label: 'Role'
    rule:
      required: 'Role je povinná'
  expiresAt: 'Datum vypršení platnosti'

action:
  cancel: 'Zrušit'
  update: 'Aktualizovat'
</i18n>

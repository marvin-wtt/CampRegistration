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

          <manager-expiration-input
            v-model="data.expiresAt"
            :event-end-at="eventEndAt"
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
import ManagerExpirationInput from '@/components/event/settings/access/ManagerExpirationInput.vue';
import type {
  EventManager,
  EventManagerUpdateData,
} from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const { manager } = defineProps<{
  manager: EventManager;
  eventEndAt: string | undefined;
  roles: QSelectOption[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<EventManagerUpdateData>({
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

action:
  cancel: 'Zrušit'
  update: 'Aktualizovat'
</i18n>

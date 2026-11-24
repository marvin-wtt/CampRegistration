<template>
  <!-- A registration's history, opened from the details dialog's menu. -->
  <responsive-dialog
    ref="dialogRef"
    :snap-points="[0.6, 'full']"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :subtitle="name"
      icon="history"
      no-form
      closable
      @cancel="onDialogCancel"
    >
      <registration-timeline
        :event-id
        :registration-id
        :created-at
      />
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import RegistrationTimeline from '@/components/event/table/dialogs/RegistrationTimeline.vue';

const { eventId, registrationId, createdAt, name } = defineProps<{
  eventId: string;
  registrationId: string;
  createdAt: string;
  name: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const { t } = useI18n();
</script>

<i18n lang="yaml" locale="en">
title: 'History'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verlauf'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Historique'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Historia'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Historie'
</i18n>

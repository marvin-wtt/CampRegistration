<template>
  <responsive-dialog
    ref="dialogRef"
    :snap-points="['full']"
    @hide="onDialogHide"
  >
    <q-card
      class="picker-card column no-wrap"
      :class="sheet ? 'picker-card--sheet' : 'rounded-xl'"
      :flat="sheet"
    >
      <m-toolbar class="picker-toolbar q-px-sm">
        <q-icon
          name="history"
          size="sm"
          class="q-mx-sm"
        />
        <q-toolbar-title class="text-subtitle1 text-weight-medium">
          {{ t('title') }}
        </q-toolbar-title>
        <m-btn
          v-close-popup
          class="header-btn"
          dense
          text
          round
          icon="close"
          @click="onDialogCancel"
        >
          <q-tooltip>{{ t('action.close') }}</q-tooltip>
        </m-btn>
      </m-toolbar>

      <div class="picker-hint">{{ t('hint') }}</div>

      <message-list
        class="col picker-list"
        :messages
        @select="(message) => onDialogOK(message)"
      />
    </q-card>
  </responsive-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Message } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import MessageList from '@/components/event/contact/MessageList.vue';

defineEmits([...useDialogPluginComponent.emits]);

defineProps<{
  messages: Message[];
}>();

const { t } = useI18n();
const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

// Mirrors ResponsiveDialog's switch to a bottom sheet.
const sheet = computed<boolean>(() => quasar.screen.lt.sm);
</script>

<style scoped>
.picker-card {
  width: min(560px, 95vw);
  height: 80vh;
  max-height: 85vh;
  background: var(--md3-surface-container-low);
}

/* The sheet draws the surface and sets the height. */
.picker-card--sheet {
  width: 100%;
  height: 100%;
  max-height: none;
  background: transparent;
}

.picker-toolbar {
  background: transparent;
}

.header-btn {
  color: var(--md3-on-surface-variant);
}

.picker-hint {
  padding: 0 20px 12px;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

.picker-list {
  padding: 0 8px 12px;
}

.picker-card--sheet .picker-list {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
</style>

<i18n lang="yaml" locale="en">
title: 'Start from a sent message'
hint: 'Subject, text and attachments are copied. You choose the recipients.'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Gesendete Nachricht übernehmen'
hint: 'Betreff, Text und Anhänge werden übernommen. Die Empfänger wählst du selbst.'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Partir d’un message envoyé'
hint: 'L’objet, le texte et les pièces jointes sont copiés. Vous choisissez les destinataires.'
action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Użyj wysłanej wiadomości'
hint: 'Temat, treść i załączniki zostaną skopiowane. Odbiorców wybierasz samodzielnie.'
action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vyjít z odeslané zprávy'
hint: 'Předmět, text a přílohy se zkopírují. Příjemce si vybereš sám.'
action:
  close: 'Zavřít'
</i18n>

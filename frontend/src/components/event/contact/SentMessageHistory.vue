<template>
  <q-btn
    flat
    round
    dense
    icon="history"
    :aria-label="t('title')"
    @click="open = true"
  >
    <q-badge
      v-if="messages.length > 0"
      floating
      color="primary"
    >
      {{ messages.length }}
    </q-badge>
    <q-tooltip>{{ t('title') }}</q-tooltip>
  </q-btn>

  <q-dialog
    v-model="open"
    :maximized="quasar.screen.lt.sm"
  >
    <q-card class="history-dialog column no-wrap">
      <q-toolbar class="history-toolbar q-px-sm">
        <q-btn
          v-if="quasar.screen.lt.sm && mobileDetail"
          flat
          round
          dense
          icon="arrow_back"
          :aria-label="t('action.back')"
          @click="mobileDetail = false"
        />
        <q-icon
          v-else
          name="history"
          size="sm"
          class="q-mx-sm"
        />
        <q-toolbar-title class="text-subtitle1 text-weight-medium">
          {{ t('title') }}
          <span
            v-if="messages.length > 0"
            class="history-count"
          >
            {{ messages.length }}
          </span>
        </q-toolbar-title>
        <q-btn
          v-close-popup
          flat
          round
          dense
          icon="close"
          :aria-label="t('action.close')"
        />
      </q-toolbar>

      <!-- Empty -->
      <div
        v-if="messages.length === 0"
        class="history-empty col"
      >
        <q-icon
          name="mark_email_read"
          size="3rem"
        />
        <div class="text-body2">{{ t('empty') }}</div>
      </div>

      <div
        v-else
        class="history-body row no-wrap col"
      >
        <!-- List pane -->
        <div
          class="history-list column no-wrap"
          :class="{ 'pane--hidden': quasar.screen.lt.sm && mobileDetail }"
        >
          <div class="history-search">
            <q-input
              v-model="search"
              dense
              borderless
              clearable
              class="history-search__input rounded-full"
              :placeholder="t('search')"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <q-virtual-scroll
            v-if="filtered.length > 0"
            :items="filtered"
            class="history-items col scroll"
          >
            <template #default="{ item }">
              <q-item
                :key="item.id"
                v-ripple
                clickable
                :active="item.id === selectedId"
                active-class="history-item--active"
                class="history-item rounded-xl"
                @click="selectMessage(item)"
              >
                <q-item-section>
                  <q-item-label
                    lines="1"
                    class="history-item__subject"
                  >
                    {{ item.subject }}
                  </q-item-label>
                  <q-item-label class="history-item__meta">
                    <span>
                      {{ item.createdAt ? d(item.createdAt, 'dateTime') : '' }}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span class="history-item__recipients">
                      <q-icon
                        name="group"
                        size="14px"
                      />
                      {{ recipientCount(item) }}
                    </span>
                    <q-icon
                      v-if="hasBounce(item)"
                      name="error_outline"
                      size="16px"
                      class="history-item__bounce"
                    >
                      <q-tooltip>{{ t('someBounced') }}</q-tooltip>
                    </q-icon>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-virtual-scroll>

          <div
            v-else
            class="history-empty col"
          >
            <q-icon
              name="search_off"
              size="2.5rem"
            />
            <div class="text-body2">{{ t('noResults') }}</div>
          </div>
        </div>

        <!-- Detail pane -->
        <div
          class="history-detail column no-wrap col rounded-xl"
          :class="{ 'pane--hidden': quasar.screen.lt.sm && !mobileDetail }"
        >
          <template v-if="selected">
            <div class="history-detail__content col scroll">
              <message-details-content
                :message="selected"
                :registrations
              />
            </div>

            <div
              v-if="canDelete || canReuse"
              class="history-detail__actions"
            >
              <m-btn
                v-if="canDelete"
                text
                error
                no-caps
                icon="delete_outline"
                :label="quasar.screen.lt.sm ? undefined : t('action.delete')"
                :aria-label="t('action.delete')"
                @click="confirmDelete(selected)"
              />
              <m-btn
                v-if="canReuse"
                primary
                no-caps
                icon="edit_note"
                :label="t('action.reuse')"
                @click="onResend(selected)"
              />
            </div>
          </template>

          <div
            v-else
            class="history-empty col"
          >
            <q-icon
              name="drafts"
              size="2.5rem"
            />
            <div class="text-body2">{{ t('selectHint') }}</div>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { Message, Registration } from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import MessageDetailsContent from '@/components/event/contact/MessageDetailsContent.vue';

const {
  messages,
  registrations,
  canDelete = false,
  canReuse = false,
} = defineProps<{
  messages: Message[];
  registrations: Registration[];
  canDelete?: boolean;
  canReuse?: boolean;
}>();

const emit = defineEmits<{
  (e: 'resend', template: Message): void;
  (e: 'delete', template: Message): void;
}>();

const { t, d } = useI18n();
const quasar = useQuasar();

const open = ref<boolean>(false);
const search = ref<string>('');
const selectedId = ref<string | null>(null);
const mobileDetail = ref<boolean>(false);

const filtered = computed<Message[]>(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return messages;
  }
  return messages.filter((message) =>
    message.subject.toLowerCase().includes(query),
  );
});

const selected = computed<Message | null>(
  () => messages.find((message) => message.id === selectedId.value) ?? null,
);

function recipientCount(template: Message): number {
  return template.recipients?.length ?? 0;
}

function hasBounce(template: Message): boolean {
  return (template.recipients ?? []).some((r) =>
    r.deliveries.some((d) => d.bouncedAt),
  );
}

function selectMessage(template: Message) {
  selectedId.value = template.id;
  if (quasar.screen.lt.sm) {
    mobileDetail.value = true;
  }
}

function onResend(template: Message) {
  emit('resend', template);
  open.value = false;
}

function confirmDelete(template: Message) {
  quasar
    .dialog({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message'),
      ok: {
        label: t('action.delete'),
        color: 'negative',
        rounded: true,
      },
      cancel: {
        color: 'primary',
        flat: true,
        rounded: true,
      },
      persistent: true,
    })
    .onOk(() => {
      emit('delete', template);
    });
}

// On wide screens auto-select the first message so the detail pane isn't empty.
watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }
  mobileDetail.value = false;
  if (quasar.screen.gt.xs && !selected.value) {
    selectedId.value = filtered.value[0]?.id ?? null;
  }
});

// Keep the selection valid as the list changes (e.g. after a delete).
watch(
  () => messages,
  (list) => {
    if (selectedId.value && !list.some((m) => m.id === selectedId.value)) {
      selectedId.value = quasar.screen.gt.xs ? (list[0]?.id ?? null) : null;
      if (quasar.screen.lt.sm) {
        mobileDetail.value = false;
      }
    }
  },
);
</script>

<style scoped>
.history-dialog {
  width: 960px;
  max-width: 95vw;
  height: 80vh;
  max-height: 85vh;
  background: var(--md3-surface-container-low);
}

.history-toolbar {
  background: transparent;
}

.history-count {
  margin-left: 6px;
  color: var(--md3-on-surface-variant);
  font-weight: 400;
}

.history-body {
  min-height: 0;
  gap: 8px;
  padding: 0 12px 12px;
}

.history-list,
.history-detail {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.history-search {
  padding: 0 4px 8px;
}

/* MD3 search bar: filled and fully rounded, no outline. */
.history-search__input {
  padding: 0 12px;
  background: var(--md3-surface-container-high);
}

.history-items {
  padding: 0 4px;
}

.history-item {
  min-height: 56px;
  margin-bottom: 2px;
  color: var(--md3-on-surface);
}

.history-item--active {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.history-item__subject {
  font-weight: 500;
}

.history-item__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 12px;
}

.history-item--active .history-item__meta {
  color: inherit;
}

.history-item__recipients {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.history-item__bounce {
  color: var(--md3-error);
}

/* The reading pane sits on its own raised surface. */
.history-detail {
  flex: 1 1 0;
  background: var(--md3-surface);
}

.history-detail__content {
  padding: 20px 24px;
}

.history-detail__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--md3-on-surface-variant);
  text-align: center;
}

@media (min-width: 600px) {
  .history-list {
    flex: 0 0 320px;
  }
}

@media (max-width: 599px) {
  .history-list,
  .history-detail {
    flex: 1 1 100%;
    width: 100%;
  }
}

.pane--hidden {
  display: none !important;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Sent messages'
empty: 'Messages you send appear here.'
search: 'Search messages'
noResults: 'No messages match your search.'
selectHint: 'Select a message to view it.'
someBounced: 'One or more recipients could not be reached'
action:
  reuse: 'Use as template'
  delete: 'Delete'
  close: 'Close'
  back: 'Back'
dialog:
  delete:
    title: 'Delete message'
    message: 'Delete this sent message from the history? Already delivered emails are not affected.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Gesendete Nachrichten'
empty: 'Von dir gesendete Nachrichten erscheinen hier.'
search: 'Nachrichten suchen'
noResults: 'Keine Nachrichten entsprechen deiner Suche.'
selectHint: 'Wähle eine Nachricht aus, um sie anzuzeigen.'
someBounced: 'Ein oder mehrere Empfänger konnten nicht erreicht werden'
action:
  reuse: 'Als Vorlage verwenden'
  delete: 'Löschen'
  close: 'Schließen'
  back: 'Zurück'
dialog:
  delete:
    title: 'Nachricht löschen'
    message: 'Diese gesendete Nachricht aus dem Verlauf löschen? Bereits zugestellte E-Mails sind nicht betroffen.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Messages envoyés'
empty: 'Les messages que vous envoyez apparaissent ici.'
search: 'Rechercher des messages'
noResults: 'Aucun message ne correspond à votre recherche.'
selectHint: 'Sélectionnez un message pour l’afficher.'
someBounced: "Un ou plusieurs destinataires n'ont pas pu être joints"
action:
  reuse: 'Utiliser comme modèle'
  delete: 'Supprimer'
  close: 'Fermer'
  back: 'Retour'
dialog:
  delete:
    title: 'Supprimer le message'
    message: "Supprimer ce message envoyé de l'historique ? Les e-mails déjà livrés ne sont pas affectés."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wysłane wiadomości'
empty: 'Wysłane przez Ciebie wiadomości pojawią się tutaj.'
search: 'Szukaj wiadomości'
noResults: 'Brak wiadomości pasujących do wyszukiwania.'
selectHint: 'Wybierz wiadomość, aby ją wyświetlić.'
someBounced: 'Co najmniej jeden odbiorca nie mógł zostać osiągnięty'
action:
  reuse: 'Użyj jako szablon'
  delete: 'Usuń'
  close: 'Zamknij'
  back: 'Wstecz'
dialog:
  delete:
    title: 'Usuń wiadomość'
    message: 'Usunąć tę wysłaną wiadomość z historii? Już dostarczone e-maile nie zostaną zmienione.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odeslané zprávy'
empty: 'Zprávy, které odešlete, se zobrazí zde.'
search: 'Hledat zprávy'
noResults: 'Žádné zprávy neodpovídají hledání.'
selectHint: 'Vyber zprávu pro zobrazení.'
someBounced: 'Jednoho nebo více příjemců se nepodařilo zastihnout'
action:
  reuse: 'Použít jako šablonu'
  delete: 'Smazat'
  close: 'Zavřít'
  back: 'Zpět'
dialog:
  delete:
    title: 'Smazat zprávu'
    message: 'Smazat tuto odeslanou zprávu z historie? Již doručené e-maily nebudou ovlivněny.'
</i18n>

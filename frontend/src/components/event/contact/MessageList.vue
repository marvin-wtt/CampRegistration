<template>
  <div class="message-list column no-wrap">
    <div class="message-list__search">
      <q-input
        v-model="search"
        dense
        borderless
        clearable
        class="message-list__search-input rounded-full"
        :placeholder="t('search')"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <div class="message-list__items">
      <q-item
        v-for="item in filtered"
        :key="item.id"
        v-ripple
        clickable
        :active="item.id === selectedId"
        active-class="message-item--active"
        class="message-item rounded-xl"
        @click="emit('select', item)"
      >
        <q-item-section>
          <q-item-label
            lines="1"
            class="message-item__subject"
          >
            {{ item.subject }}
          </q-item-label>
          <q-item-label class="message-item__meta">
            <span>
              {{ item.createdAt ? d(item.createdAt, 'dateTime') : '' }}
            </span>
            <span aria-hidden="true">·</span>
            <span class="message-item__recipients">
              <q-icon
                name="group"
                size="14px"
              />
              {{ item.recipients?.length ?? 0 }}
            </span>
          </q-item-label>
        </q-item-section>
        <q-item-section
          v-if="bouncedCount(item) > 0"
          side
        >
          <span class="message-item__bounced">
            <q-icon
              name="error_outline"
              size="14px"
            />
            {{ bouncedCount(item) }}
          </span>
          <q-tooltip>{{ t('bounced', bouncedCount(item)) }}</q-tooltip>
        </q-item-section>
      </q-item>

      <div
        v-if="messages.length === 0"
        class="message-list__empty"
      >
        <q-icon
          name="mark_email_read"
          size="2.5rem"
        />
        <div class="text-body2">{{ t('empty') }}</div>
      </div>
      <div
        v-else-if="search && filtered.length === 0"
        class="message-list__empty"
      >
        <q-icon
          name="search_off"
          size="2.5rem"
        />
        <div class="text-body2">{{ t('noResults') }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Message } from '@camp-registration/common/entities';
import { undeliveredRecipients } from '@/components/event/contact/contactHelpers';

const { messages, selectedId = null } = defineProps<{
  messages: Message[];
  selectedId?: string | null;
}>();

const emit = defineEmits<{
  select: [message: Message];
}>();

const { t, d } = useI18n();

const search = ref<string>('');

const filtered = computed<Message[]>(() => {
  const query = (search.value ?? '').trim().toLowerCase();
  if (!query) {
    return messages;
  }
  return messages.filter((message) =>
    message.subject.toLowerCase().includes(query),
  );
});

function bouncedCount(message: Message): number {
  return undeliveredRecipients(message).length;
}
</script>

<style scoped>
.message-list {
  min-height: 0;
}

.message-list__search {
  padding: 0 4px 8px;
}

/* MD3 search bar: filled and fully rounded, no outline. */
.message-list__search-input {
  padding: 0 12px;
  background: var(--md3-surface-container-high);
}

/* Grows with its messages, and scrolls once a sized parent holds it back. */
.message-list__items {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0 4px;
  overflow-y: auto;
}

.message-item {
  min-height: 56px;
  margin-bottom: 2px;
  color: var(--md3-on-surface);
}

.message-item--active {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.message-item--active .message-item__meta {
  color: inherit;
}

.message-item__subject {
  font-weight: 500;
}

.message-item__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 12px;
}

.message-item__recipients {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.message-item__bounced {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  color: var(--md3-on-error-container);
  font-size: 12px;
  font-weight: 600;
  background: var(--md3-error-container);
  border-radius: 999px;
}

.message-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--md3-on-surface-variant);
  text-align: center;
}
</style>

<i18n lang="yaml" locale="en">
search: 'Search messages'
empty: 'Messages you send appear here.'
noResults: 'No messages match your search.'
bounced: 'Not delivered to {n} recipient | Not delivered to {n} recipients'
</i18n>

<i18n lang="yaml" locale="de">
search: 'Nachrichten suchen'
empty: 'Von dir gesendete Nachrichten erscheinen hier.'
noResults: 'Keine Nachrichten entsprechen deiner Suche.'
bounced: 'An {n} Empfänger nicht zugestellt | An {n} Empfänger nicht zugestellt'
</i18n>

<i18n lang="yaml" locale="fr">
search: 'Rechercher des messages'
empty: 'Les messages que vous envoyez apparaissent ici.'
noResults: 'Aucun message ne correspond à votre recherche.'
bounced: 'Non distribué à {n} destinataire | Non distribué à {n} destinataires'
</i18n>

<i18n lang="yaml" locale="pl">
search: 'Szukaj wiadomości'
empty: 'Wysłane przez Ciebie wiadomości pojawią się tutaj.'
noResults: 'Brak wiadomości pasujących do wyszukiwania.'
bounced: 'Nie dostarczono do odbiorców: {n} | Nie dostarczono do odbiorców: {n}'
</i18n>

<i18n lang="yaml" locale="cs">
search: 'Hledat zprávy'
empty: 'Zprávy, které odešlete, se zobrazí zde.'
noResults: 'Žádné zprávy neodpovídají hledání.'
bounced: 'Nedoručeno příjemcům: {n} | Nedoručeno příjemcům: {n}'
</i18n>

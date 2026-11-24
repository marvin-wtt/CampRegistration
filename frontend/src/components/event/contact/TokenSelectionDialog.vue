<template>
  <responsive-dialog
    ref="dialogRef"
    :snap-points="['full']"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :subtitle="t('description')"
      icon="data_object"
      :width="520"
      no-form
      @cancel="onDialogCancel"
    >
      <template #pinned>
        <!-- No autofocus on phones: the keyboard would cover the sheet. -->
        <q-input
          v-model="search"
          :placeholder="t('search')"
          :autofocus="!quasar.screen.lt.sm"
          clearable
          dense
          outlined
          rounded
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <q-list>
        <q-item
          v-if="!searching && path.length > 0"
          clickable
          class="rounded-xl"
          @click="path.pop()"
        >
          <q-item-section avatar>
            <q-icon name="arrow_back" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ path.map(({ label }) => label).join(' › ') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-for="item in items"
          :key="isTokenGroup(item) ? `group:${item.label}` : item.value"
          clickable
          class="rounded-xl"
          @click="onSelect(item)"
        >
          <q-item-section>
            <q-item-label>
              {{ item.label }}
            </q-item-label>
            <q-item-label
              v-if="caption(item)"
              caption
            >
              {{ caption(item) }}
            </q-item-label>
          </q-item-section>
          <q-item-section
            v-if="isTokenGroup(item)"
            side
          >
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>

        <q-item v-if="items.length === 0">
          <q-item-section class="description">
            {{ t('empty') }}
          </q-item-section>
        </q-item>
      </q-list>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import type {
  TokenGroup,
  TokenItem,
} from '@/components/event/contact/TokenRegistry';
import {
  flattenTokens,
  isTokenGroup,
} from '@/components/event/contact/TokenRegistry';
import { computed, ref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
const quasar = useQuasar();

const { tokens } = defineProps<{
  tokens: TokenItem[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const path = ref<TokenGroup[]>([]);
const search = ref<string | null>('');

const query = computed(() => search.value?.trim().toLowerCase() ?? '');
const searching = computed(() => query.value.length > 0);

const items = computed<TokenItem[]>(() => {
  if (searching.value) {
    return flattenTokens(tokens).filter((token) =>
      [token.label, token.caption, token.category].some((text) =>
        text?.toLowerCase().includes(query.value),
      ),
    );
  }

  return path.value.at(-1)?.items ?? tokens;
});

// Search results come from every group, so they name theirs.
function caption(item: TokenItem): string | undefined {
  if (isTokenGroup(item) || !searching.value) {
    return item.caption;
  }

  return [item.category, item.caption].filter(Boolean).join(' · ');
}

function onSelect(item: TokenItem) {
  if (isTokenGroup(item)) {
    path.value.push(item);
    return;
  }

  onDialogOK({
    token: {
      ...item,
      category: item.category ?? path.value.at(-1)?.label,
    },
  });
}
</script>

<style scoped>
.description {
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Insert a variable'
description: 'Variables are placeholders that are replaced with the actual values when the message is sent.'
search: 'Search variables'
empty: 'No matching variables'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Variable einfügen'
description: 'Variablen sind Platzhalter, die beim Versand der Nachricht durch die tatsächlichen Werte ersetzt werden.'
search: 'Variablen durchsuchen'
empty: 'Keine passenden Variablen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Insérer une variable'
description: "Les variables sont des espaces réservés qui sont remplacés par les valeurs réelles lors de l'envoi du message."
search: 'Rechercher des variables'
empty: 'Aucune variable correspondante'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wstaw zmienną'
description: 'Zmienne to symbole zastępcze, które podczas wysyłania wiadomości są zastępowane rzeczywistymi wartościami.'
search: 'Szukaj zmiennych'
empty: 'Brak pasujących zmiennych'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vložit proměnnou'
description: 'Proměnné jsou zástupné symboly, které se při odeslání zprávy nahradí skutečnými hodnotami.'
search: 'Hledat proměnné'
empty: 'Žádné odpovídající proměnné'
</i18n>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="q-pb-none">
        <div class="text-h6">
          {{ t('title') }}
        </div>
        <div class="description text-body2 q-mt-xs">
          {{ t('description') }}
        </div>
      </q-card-section>

      <q-card-section v-if="selectedToken">
        <q-list>
          <q-item
            v-for="item in selectedToken.items"
            :key="item.value"
            v-close-popup
            clickable
            @click="onTokenSelect(item)"
          >
            <q-item-section>
              <q-item-label>
                {{ item.label }}
              </q-item-label>
              <q-item-label caption>
                {{ item.caption }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  Token,
  TokenRegistry,
} from '@/components/eventManagement/contact/TokenRegistry';
import { ref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();

const { tokens } = defineProps<{
  tokens: TokenRegistry[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const selectedToken = ref<TokenRegistry>({
  label: '',
  value: '',
  items: tokens,
});

function onTokenSelect(token: TokenRegistry | Token) {
  if ('items' in token) {
    selectedToken.value = {
      ...token,
      items: token.items.map((item) => ({
        ...item,
        value:
          token.value.length > 0 ? `${token.value}.${item.value}` : item.value,
        caption: item.caption ?? item.value,
        category: item.category ?? token.label,
      })) as TokenRegistry['items'],
    };
    return;
  }

  onDialogOK({
    token,
  });
}
</script>

<style scoped>
.description {
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Insert a token'
description: 'Tokens are placeholders that are replaced with the actual values when the message is sent.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Token einfügen'
description: 'Token sind Platzhalter, die beim Versand der Nachricht durch die tatsächlichen Werte ersetzt werden.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Insérer un jeton'
description: "Les jetons sont des espaces réservés qui sont remplacés par les valeurs réelles lors de l'envoi du message."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wstaw zmienną'
description: 'Zmienne to symbole zastępcze, które podczas wysyłania wiadomości są zastępowane rzeczywistymi wartościami.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vložit token'
description: 'Tokeny jsou zástupné symboly, které se při odeslání zprávy nahradí skutečnými hodnotami.'
</i18n>

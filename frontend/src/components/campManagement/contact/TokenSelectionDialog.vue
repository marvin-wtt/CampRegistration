<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h5 text-center">
        <template v-if="selectedToken">
          {{ selectedToken.label }}
        </template>
        <template v-else>
          {{ t('title') }}
        </template>
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
} from 'components/campManagement/contact/TokenRegistry';
import { ref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();

const props = defineProps<{
  tokens: TokenRegistry[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const selectedToken = ref<TokenRegistry>({
  label: '',
  value: '',
  items: props.tokens,
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

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Select a token'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Wählen Sie ein Token aus'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Sélectionner un jeton'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wybierz zmienną'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vyberte token'
</i18n>

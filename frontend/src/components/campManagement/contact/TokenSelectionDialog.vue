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
                {{ item.value }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section v-else>
        <q-list>
          <q-item
            v-for="token in tokenOptions"
            :key="token.key"
            clickable
            @click="selectedToken = token"
          >
            <q-item-section>
              {{ token.label }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { type Token } from 'components/campManagement/contact/Token';
import { computed, ref } from 'vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();

const props = defineProps<{
  tokens: Token[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const selectedToken = ref<Token>();

const tokenOptions = computed<Token[]>(() => {
  return props.tokens.filter((token) => token.items.length > 0);
});

function onTokenSelect(item: QSelectOption) {
  onDialogOK({
    token: selectedToken.value,
    item,
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

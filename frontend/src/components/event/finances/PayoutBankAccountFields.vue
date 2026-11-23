<template>
  <!-- Optional: cash, PayPal and the like need none. -->
  <div class="column no-wrap">
    <m-btn
      v-if="!open"
      :label="t('add')"
      icon="account_balance"
      text
      rounded
      color="primary"
      class="self-start"
      data-test="payout-bank-add"
      @click="open = true"
    />

    <div
      v-else
      class="column no-wrap q-gutter-y-sm"
    >
      <div class="row items-center justify-between no-wrap">
        <span class="text-subtitle2 text-on-surface-variant">
          {{ t('title') }}
        </span>
        <m-btn
          v-if="!readonly"
          :label="t('remove')"
          text
          rounded
          color="primary"
          size="sm"
          data-test="payout-bank-remove"
          @click="remove"
        />
      </div>
      <q-input
        v-model="holder"
        :label="t('holder')"
        :readonly
        maxlength="255"
        outlined
        rounded
        hide-bottom-space
        :rules="[(v: string) => !!v.trim() || t('holderRequired')]"
        data-test="payout-bank-holder"
      />
      <q-input
        v-model="iban"
        :label="t('iban')"
        :readonly
        autocomplete="off"
        spellcheck="false"
        outlined
        rounded
        hide-bottom-space
        class="text-mono"
        :rules="[(v: string) => isValidIban(v) || t('ibanInvalid')]"
        lazy-rules
        data-test="payout-bank-iban"
      />
      <q-input
        :model-value="bic"
        :label="t('bic')"
        :hint="readonly ? undefined : t('optional')"
        :readonly
        autocomplete="off"
        spellcheck="false"
        outlined
        rounded
        :rules="[(v: string) => !v || BIC_PATTERN.test(v) || t('bicInvalid')]"
        lazy-rules
        data-test="payout-bank-bic"
        @update:model-value="(v) => (bic = normalizeBic(String(v ?? '')))"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { PayoutBankAccount } from '@camp-registration/common/entities';
import {
  BIC_PATTERN,
  formatIban,
  isValidIban,
  normalizeBic,
  normalizeIban,
} from '@camp-registration/common/utils';

const { defaultHolder, readonly = false } = defineProps<{
  /** Prefilled as the holder when the fields are opened empty. */
  defaultHolder: string;
  readonly?: boolean;
}>();

/** `null` while the section is closed. */
const model = defineModel<PayoutBankAccount | null>({ required: true });

const { t } = useI18n();

const open = ref(model.value !== null);
const holder = ref(model.value?.holder ?? defaultHolder);
// Shown grouped, kept as typed: reformatting while typing moves the cursor.
const iban = ref(model.value ? formatIban(model.value.iban) : '');
const bic = ref(model.value?.bic ?? '');

watch([open, holder, iban, bic], () => {
  model.value = open.value
    ? {
        holder: holder.value.trim(),
        iban: normalizeIban(iban.value),
        bic: bic.value || null,
      }
    : null;
});

function remove() {
  open.value = false;
  holder.value = defaultHolder;
  iban.value = '';
  bic.value = '';
}
</script>

<i18n lang="yaml" locale="en">
add: 'Add bank details'
title: 'Bank transfer to'
remove: 'Remove'
holder: 'Account holder'
holderRequired: 'Enter the account holder'
iban: 'IBAN'
ibanInvalid: 'This IBAN is not valid'
bic: 'BIC'
bicInvalid: 'A BIC has 8 or 11 characters'
optional: 'Optional'
</i18n>

<i18n lang="yaml" locale="de">
add: 'Bankverbindung hinzufügen'
title: 'Überweisung an'
remove: 'Entfernen'
holder: 'Kontoinhaber'
holderRequired: 'Gib den Kontoinhaber an'
iban: 'IBAN'
ibanInvalid: 'Diese IBAN ist ungültig'
bic: 'BIC'
bicInvalid: 'Eine BIC hat 8 oder 11 Zeichen'
optional: 'Optional'
</i18n>

<i18n lang="yaml" locale="fr">
add: 'Ajouter des coordonnées bancaires'
title: 'Virement à'
remove: 'Retirer'
holder: 'Titulaire du compte'
holderRequired: 'Indiquez le titulaire du compte'
iban: 'IBAN'
ibanInvalid: "Cet IBAN n'est pas valide"
bic: 'BIC'
bicInvalid: 'Un BIC comporte 8 ou 11 caractères'
optional: 'Facultatif'
</i18n>

<i18n lang="yaml" locale="pl">
add: 'Dodaj dane bankowe'
title: 'Przelew na rzecz'
remove: 'Usuń'
holder: 'Właściciel rachunku'
holderRequired: 'Podaj właściciela rachunku'
iban: 'IBAN'
ibanInvalid: 'Ten IBAN jest nieprawidłowy'
bic: 'BIC'
bicInvalid: 'BIC ma 8 lub 11 znaków'
optional: 'Opcjonalnie'
</i18n>

<i18n lang="yaml" locale="cs">
add: 'Přidat bankovní spojení'
title: 'Převod na účet'
remove: 'Odebrat'
holder: 'Majitel účtu'
holderRequired: 'Zadej majitele účtu'
iban: 'IBAN'
ibanInvalid: 'Tento IBAN není platný'
bic: 'BIC'
bicInvalid: 'BIC má 8 nebo 11 znaků'
optional: 'Nepovinné'
</i18n>

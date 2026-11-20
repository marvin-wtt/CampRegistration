<template>
  <!-- Art. 13(1)(b): the DPO's contact details, if the organisation has one. -->
  <div>
    <q-toggle
      v-model="hasDpo"
      :label="t('hasDpo')"
      :disable="!canEdit"
    />
    <div
      v-if="dpo"
      class="column q-gutter-y-sm dpo-fields"
    >
      <q-input
        v-model="dpo.name"
        :label="t('name')"
        dense
        outlined
        rounded
        :disable="!canEdit"
        :rules="[filled]"
        lazy-rules
        hide-bottom-space
      />
      <q-input
        v-model="dpo.email"
        type="email"
        :label="t('email')"
        dense
        outlined
        rounded
        :disable="!canEdit"
        :rules="[filled]"
        lazy-rules
        hide-bottom-space
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PrivacyDataProtectionOfficer } from '@camp-registration/common/privacy';

const dpo = defineModel<PrivacyDataProtectionOfficer | null>({
  required: true,
});

defineProps<{ canEdit: boolean }>();

const { t } = useI18n();

// Checked once the field is left, not the moment the switch reveals it.
const filled = (value: string) => value.trim() !== '' || t('required');

const hasDpo = computed({
  get: () => dpo.value !== null,
  set: (on: boolean) => {
    dpo.value = on ? { name: '', email: '' } : null;
  },
});
</script>

<style lang="scss" scoped>
// Under the toggle's label, not its switch.
.dpo-fields {
  margin-left: 2.75rem;
  margin-top: 0.5rem;
}
</style>

<i18n lang="yaml" locale="en">
hasDpo: 'We have a data protection officer'
name: 'Name'
email: 'Email'
required: 'Required'
</i18n>

<i18n lang="yaml" locale="de">
hasDpo: 'Datenschutzbeauftragte Person vorhanden'
name: 'Name'
email: 'E-Mail'
required: 'Pflichtangabe'
</i18n>

<i18n lang="yaml" locale="fr">
hasDpo: 'Nous avons un délégué à la protection des données'
name: 'Nom'
email: 'E-mail'
required: 'Obligatoire'
</i18n>

<i18n lang="yaml" locale="cs">
hasDpo: 'Máme pověřence pro ochranu osobních údajů'
name: 'Jméno'
email: 'E-mail'
required: 'Povinný údaj'
</i18n>

<i18n lang="yaml" locale="pl">
hasDpo: 'Mamy inspektora ochrony danych'
name: 'Imię i nazwisko'
email: 'E-mail'
required: 'Pole wymagane'
</i18n>

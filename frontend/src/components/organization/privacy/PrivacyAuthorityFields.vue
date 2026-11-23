<template>
  <!-- Under a law whose authority follows the diocese or regional church, the
       organization names it: nothing the platform knows identifies it
       (docs/privacy.md, 4). -->
  <div data-test="privacy-authority">
    <div class="text-subtitle2">{{ t('title') }}</div>
    <div class="text-caption text-on-surface-variant q-mb-sm">
      {{ hint }}
    </div>
    <div class="column q-gutter-sm">
      <q-input
        :model-value="model?.name ?? ''"
        :label="t('name')"
        :disable="!canEdit"
        :rules="[(value: string) => !!value.trim() || t('required')]"
        lazy-rules
        dense
        outlined
        rounded
        data-test="privacy-authority-name"
        @update:model-value="(value) => update({ name: String(value ?? '') })"
      />
      <q-input
        :model-value="model?.website ?? ''"
        :label="t('website')"
        :disable="!canEdit"
        :rules="[
          (value: string) =>
            !value ||
            /^https?:\/\/\S+\.\S+/i.test(value) ||
            t('websiteInvalid'),
        ]"
        lazy-rules
        type="url"
        dense
        outlined
        rounded
        data-test="privacy-authority-website"
        @update:model-value="
          (value) => update({ website: value ? String(value) : null })
        "
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { PrivacyNoticeAuthority } from '@camp-registration/common/privacy';

const model = defineModel<PrivacyNoticeAuthority | null | undefined>();

defineProps<{
  canEdit: boolean;
  /** Which authority is competent under the notice's law. */
  hint: string;
}>();

const { t } = useI18n();

function update(change: Partial<PrivacyNoticeAuthority>) {
  model.value = { name: '', website: null, ...model.value, ...change };
}
</script>

<i18n lang="yaml" locale="en">
title: 'Supervisory authority'
name: 'Name of the authority'
website: 'Website (optional)'
required: 'Name the authority registrants can complain to'
websiteInvalid: 'Enter the full address, starting with https://'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Aufsichtsbehörde'
name: 'Name der Aufsichtsbehörde'
website: 'Website (optional)'
required: 'Nenne die Behörde, bei der sich Angemeldete beschweren können'
websiteInvalid: 'Gib die vollständige Adresse an, beginnend mit https://'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Autorité de contrôle'
name: 'Nom de l’autorité'
website: 'Site web (facultatif)'
required: 'Indiquez l’autorité auprès de laquelle les inscrits peuvent introduire une réclamation'
websiteInvalid: 'Indiquez l’adresse complète, commençant par https://'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Dozorový úřad'
name: 'Název úřadu'
website: 'Web (nepovinné)'
required: 'Uveď úřad, u kterého si přihlášení mohou stěžovat'
websiteInvalid: 'Zadej celou adresu začínající https://'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Organ nadzorczy'
name: 'Nazwa organu'
website: 'Strona internetowa (opcjonalnie)'
required: 'Podaj organ, do którego zgłoszeni mogą wnieść skargę'
websiteInvalid: 'Podaj pełny adres zaczynający się od https://'
</i18n>

<template>
  <q-card>
    <q-form
      @submit="onSave"
      @reset="onReset"
    >
      <q-card-section class="text-h4">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <q-input
          v-model="data.name"
          :label="t('field.name.label')"
          :rules="[
            (val?: string) => !!val || t('field.name.rule.required'),
            (val: string) => val.length >= 5 || t('field.name.rule.minlength'),
            (val: string) => val.length < 100 || t('field.name.rule.maxlength'),
          ]"
          hide-bottom-space
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="person" />
          </template>
        </q-input>

        <locale-input
          v-model="data.locale"
          :label="t('field.locale.label')"
          :rules="[
            (val?: string) => !!val || t('field.locale.rule.required'),
            (val: string) =>
              val.length === 2 ||
              val.length === 5 ||
              t('field.name.rule.invalid'),
          ]"
          hide-bottom-space
          outlined
          rounded
          class="settings-input"
          style="max-width: 200px"
        >
          <template #before>
            <q-icon name="language" />
          </template>
        </locale-input>
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="t('action.save')"
          type="submit"
          color="primary"
          outlined
          rounded
        />
        <q-btn
          :label="t('action.reset')"
          type="reset"
          outlined
          rounded
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import LocaleInput from 'components/common/inputs/LocaleInput.vue';
import { useI18n } from 'vue-i18n';
import type {
  Profile,
  ProfileUpdateData,
} from '@camp-registration/common/entities';
import { ref } from 'vue';

const { t } = useI18n();

const { profile } = defineProps<{
  profile: Profile;
}>();

const emit = defineEmits<{
  (e: 'save', data: ProfileUpdateData): void;
}>();

const data = ref<Pick<ProfileUpdateData, 'name' | 'locale'>>({
  name: profile.name,
  locale: profile.locale,
});

function onSave() {
  emit('save', data.value);
}

function onReset() {
  data.value = {
    name: profile.name,
    locale: profile.locale,
  };
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Profile'

field:
  name:
    label: 'Name'
    rule:
      required: 'The name is required'
      minlength: 'The name is too short'
      maxlength: 'The name is too long'
  locale:
    label: 'Locale'
    rule:
      required: 'The locale is required'
      invalid: 'The locale is invalid'

action:
  save: 'Update profile'
  reset: 'Reset'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Profil'

field:
  name:
    label: 'Name'
    rule:
      required: 'Der Name ist erforderlich.'
      minlength: 'Der Name ist zu kurz.'
      maxlength: 'Der Name ist zu lang.'
  locale:
    label: 'Sprache'
    rule:
      required: 'Die Sprache ist erforderlich.'
      invalid: 'Die Sprache ist ungültig.'

action:
  save: 'Profil aktualisieren'
  reset: 'Zurücksetzen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Profil'

field:
  name:
    label: 'Nom'
    rule:
      required: 'Le nom est obligatoire.'
      minlength: 'Le nom est trop court.'
      maxlength: 'Le nom est trop long.'
  locale:
    label: 'Langue'
    rule:
      required: 'La langue est obligatoire.'
      invalid: 'La langue est invalide.'

action:
  save: 'Mettre à jour le profil'
  reset: 'Réinitialiser'
</i18n>

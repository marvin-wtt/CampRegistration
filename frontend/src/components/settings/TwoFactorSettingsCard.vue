<template>
  <q-card>
    <q-form @submit="onSave">
      <q-card-section class="text-h4">
        {{ t('title') }}
        <q-badge
          align="top"
          transparent
          rounded
        >
          {{ t('comingSoon') }}
        </q-badge>
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <q-input
          v-model="data.currentPassword"
          :label="t('field.password.label')"
          type="password"
          autocomplete="current-password"
          :rules="[
            (val?: string) => !!val || t('field.password.rule.required'),
          ]"
          hide-bottom-space
          outlined
          rounded
          disable
          class="settings-input"
        >
          <template #before>
            <q-icon name="password" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="t('action.generate')"
          type="submit"
          color="primary"
          disabled
          outlined
          rounded
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ProfileUpdateData } from '@camp-registration/common/entities';
import { ref } from 'vue';

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'enable', data: Pick<ProfileUpdateData, 'currentPassword'>): void;
}>();

const data = ref<Pick<ProfileUpdateData, 'currentPassword'>>({
  currentPassword: '',
});

function onSave() {
  emit('enable', data.value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Two-factor authentication'

field:
  password:
    label: 'Password'
    rule:
      required: 'The password is required.'

action:
  generate: 'Generate code'

comingSoon: 'Coming soon'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zwei-Faktor-Authentifizierung'

field:
  password:
    label: 'Passwort'
    rule:
      required: 'Das Passwort ist erforderlich.'

action:
  generate: 'Code generieren'

comingSoon: 'Demnächst verfügbar'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Authentification à deux facteurs'

field:
  password:
    label: 'Mot de passe'
    rule:
      required: 'Le mot de passe est obligatoire.'

action:
  generate: 'Générer un code'

comingSoon: 'Bientôt disponible'
</i18n>

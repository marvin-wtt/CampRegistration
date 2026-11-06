<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form
        @submit="onSubmit"
        @reset="onDialogCancel"
      >
        <q-card-section class="text-h6">
          {{ button ? t('title.edit') : t('title.add') }}
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="label"
            :label="t('input.label.label')"
            :rules="[
              (val: string) =>
                val.trim().length > 0 || t('input.label.rule.required'),
            ]"
            autofocus
            outlined
            rounded
          />

          <q-btn-toggle
            v-if="urlTokens.length > 0"
            v-model="mode"
            class="full-width q-mb-md"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            :options="[
              { label: t('mode.url'), value: 'url' },
              { label: t('mode.token'), value: 'token' },
            ]"
          />

          <q-select
            v-if="mode === 'token'"
            v-model="token"
            :label="t('input.token.label')"
            :options="tokenOptions"
            :rules="[
              (val: string | null) => !!val || t('input.token.rule.required'),
            ]"
            emit-value
            map-options
            outlined
            rounded
          />
          <q-input
            v-else
            v-model="url"
            :label="t('input.url.label')"
            :hint="t('input.url.hint')"
            type="url"
            inputmode="url"
            :rules="[
              (val: string) => isButtonLink(val) || t('input.url.rule.valid'),
            ]"
            outlined
            rounded
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="button"
            :label="t('action.remove')"
            color="negative"
            class="q-mr-auto"
            rounded
            flat
            @click="onDialogOK(null)"
          />
          <q-btn
            :label="t('action.cancel')"
            type="reset"
            color="primary"
            rounded
            outline
          />
          <q-btn
            :label="t('action.ok')"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { type EmailButtonAttributes, isButtonLink } from './ButtonNode';
import type { VariableDefinition } from './VariableNode';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const { button, urlTokens } = defineProps<{
  button?: EmailButtonAttributes | undefined;
  urlTokens: VariableDefinition[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const TOKEN_RE = /^\{\{\s*(.+?)\s*}}$/;
const initialToken = TOKEN_RE.exec(button?.href ?? '')?.[1] ?? null;

const label = ref(button?.label ?? '');
const mode = ref<'url' | 'token'>(initialToken !== null ? 'token' : 'url');
const url = ref(initialToken === null ? (button?.href ?? 'https://') : '');
const token = ref<string | null>(initialToken);

const tokenOptions = computed(() =>
  urlTokens.map((item) => ({
    label: item.category ? `${item.category} | ${item.label}` : item.label,
    value: item.value,
  })),
);

function onSubmit() {
  const href =
    mode.value === 'token' ? `{{ ${token.value} }}` : url.value.trim();

  onDialogOK({
    label: label.value.trim(),
    href,
  } satisfies EmailButtonAttributes);
}
</script>

<i18n lang="yaml" locale="en">
title:
  add: 'Add button'
  edit: 'Edit button'

mode:
  url: 'Web address'
  token: 'Variable'

input:
  label:
    label: 'Label'
    rule:
      required: 'Label is required'
  url:
    label: 'Link'
    hint: 'A web address, mailto: or tel: link'
    rule:
      valid: 'Enter a full link starting with https://, mailto: or tel:'
  token:
    label: 'Variable'
    rule:
      required: 'Variable is required'

action:
  remove: 'Remove'
  cancel: 'Cancel'
  ok: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title:
  add: 'Button hinzufügen'
  edit: 'Button bearbeiten'

mode:
  url: 'Webadresse'
  token: 'Variable'

input:
  label:
    label: 'Beschriftung'
    rule:
      required: 'Beschriftung ist erforderlich'
  url:
    label: 'Link'
    hint: 'Eine Webadresse, ein mailto:- oder tel:-Link'
    rule:
      valid: 'Gib einen vollständigen Link ein, der mit https://, mailto: oder tel: beginnt'
  token:
    label: 'Variable'
    rule:
      required: 'Variable ist erforderlich'

action:
  remove: 'Entfernen'
  cancel: 'Abbrechen'
  ok: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  add: 'Ajouter un bouton'
  edit: 'Modifier le bouton'

mode:
  url: 'Adresse web'
  token: 'Variable'

input:
  label:
    label: 'Libellé'
    rule:
      required: 'Le libellé est obligatoire'
  url:
    label: 'Lien'
    hint: 'Une adresse web, un lien mailto: ou tel:'
    rule:
      valid: 'Saisissez un lien complet commençant par https://, mailto: ou tel:'
  token:
    label: 'Variable'
    rule:
      required: 'La variable est obligatoire'

action:
  remove: 'Supprimer'
  cancel: 'Annuler'
  ok: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  add: 'Dodaj przycisk'
  edit: 'Edytuj przycisk'

mode:
  url: 'Adres internetowy'
  token: 'Zmienna'

input:
  label:
    label: 'Etykieta'
    rule:
      required: 'Etykieta jest wymagana'
  url:
    label: 'Link'
    hint: 'Adres internetowy, link mailto: lub tel:'
    rule:
      valid: 'Wpisz pełny link zaczynający się od https://, mailto: lub tel:'
  token:
    label: 'Zmienna'
    rule:
      required: 'Zmienna jest wymagana'

action:
  remove: 'Usuń'
  cancel: 'Anuluj'
  ok: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  add: 'Přidat tlačítko'
  edit: 'Upravit tlačítko'

mode:
  url: 'Webová adresa'
  token: 'Proměnná'

input:
  label:
    label: 'Popisek'
    rule:
      required: 'Popisek je povinný'
  url:
    label: 'Odkaz'
    hint: 'Webová adresa, odkaz mailto: nebo tel:'
    rule:
      valid: 'Zadejte úplný odkaz začínající https://, mailto: nebo tel:'
  token:
    label: 'Proměnná'
    rule:
      required: 'Proměnná je povinná'

action:
  remove: 'Odebrat'
  cancel: 'Zrušit'
  ok: 'Uložit'
</i18n>

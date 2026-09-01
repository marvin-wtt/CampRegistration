<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onDialogCancel"
      >
        <q-card-section>
          <div class="text-h5 text-center">
            {{ isEdit ? t('title.edit') : t('title.create') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <translated-input
            v-model="data.name"
            :label="t('field.name.label')"
            :rules="[
              (val: string | Record<string, string> | undefined) =>
                !!val || t('field.name.rule.required'),
            ]"
            :locales="locales"
            hide-bottom-space
            autofocus
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="checklist" />
            </template>
          </translated-input>

          <q-input
            v-model.number="data.defaultCount"
            type="number"
            min="1"
            clearable
            :label="t('field.defaultCount.label')"
            :hint="t('field.defaultCount.hint')"
            outlined
            rounded
            @update:model-value="normalizeDefaultCount"
          >
            <template #prepend>
              <q-icon name="groups" />
            </template>
          </q-input>

          <q-item tag="label">
            <q-item-section>
              <q-item-label>{{ t('field.excludeStaff.label') }}</q-item-label>
              <q-item-label caption>
                {{ t('field.excludeStaff.hint') }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="data.excludeStaff" />
            </q-item-section>
          </q-item>

          <q-item tag="label">
            <q-item-section>
              <q-item-label>
                {{ t('field.balanceCountries.label') }}
              </q-item-label>
              <q-item-label caption>
                {{ t('field.balanceCountries.hint') }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="data.balanceCountries" />
            </q-item-section>
          </q-item>
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('action.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="isEdit ? t('action.save') : t('action.create')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive } from 'vue';
import type {
  Duty,
  DutyCreateData,
  DutyUpdateData,
} from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  duty?: Duty;
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const isEdit = computed<boolean>(() => props.duty !== undefined);

const data = reactive<DutyCreateData>({
  name: props.duty?.name ?? '',
  defaultCount: props.duty?.defaultCount ?? null,
  excludeStaff: props.duty?.excludeStaff ?? false,
  balanceCountries: props.duty?.balanceCountries ?? false,
});

function normalizeDefaultCount(value: string | number | null) {
  const num = typeof value === 'string' ? Number(value) : value;
  data.defaultCount = num && num > 0 ? Math.floor(num) : null;
}

function onOKClick(): void {
  const payload: DutyCreateData | DutyUpdateData = { ...data };

  onDialogOK(payload);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title:
  create: 'Add duty type'
  edit: 'Edit duty type'

field:
  name:
    label: 'Name'
    rule:
      required: 'The name is required'
  defaultCount:
    label: 'Usual number of people'
    hint: 'Optional — a starting suggestion, not a limit.'
  excludeStaff:
    label: 'Exclude staff'
    hint: 'Leave staff (and staff-only rooms) out of suggestions for this duty.'
  balanceCountries:
    label: 'Balance countries'
    hint: 'Nice to have — try to spread suggested participants across countries. Fairness always comes first.'

action:
  cancel: 'Cancel'
  create: 'Create'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Dienst hinzufügen'
  edit: 'Dienst bearbeiten'

field:
  name:
    label: 'Name'
    rule:
      required: 'Der Name ist erforderlich'
  defaultCount:
    label: 'Übliche Personenzahl'
    hint: 'Optional — ein Vorschlag, kein Limit.'
  excludeStaff:
    label: 'Betreuende ausschließen'
    hint: 'Betreuende (und reine Betreuer-Zimmer) bei Vorschlägen für diesen Dienst weglassen.'
  balanceCountries:
    label: 'Länder ausgleichen'
    hint: 'Nice-to-have — versucht, vorgeschlagene Teilnehmende über Länder zu streuen. Fairness hat immer Vorrang.'

action:
  cancel: 'Abbrechen'
  create: 'Erstellen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Ajouter un type de corvée'
  edit: 'Modifier le type de corvée'

field:
  name:
    label: 'Nom'
    rule:
      required: 'Le nom est requis'
  defaultCount:
    label: 'Nombre de personnes habituel'
    hint: 'Facultatif — une suggestion de départ, pas une limite.'
  excludeStaff:
    label: "Exclure l'encadrement"
    hint: "Ne pas proposer l'encadrement (ni les chambres réservées à l'encadrement) pour cette corvée."
  balanceCountries:
    label: 'Équilibrer les pays'
    hint: "Bonus — essaie de répartir les participants suggérés entre les pays. L'équité reste toujours prioritaire."

action:
  cancel: 'Annuler'
  create: 'Créer'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Dodaj rodzaj dyżuru'
  edit: 'Edytuj rodzaj dyżuru'

field:
  name:
    label: 'Nazwa'
    rule:
      required: 'Nazwa jest wymagana'
  defaultCount:
    label: 'Zwykła liczba osób'
    hint: 'Opcjonalne — sugestia początkowa, nie limit.'
  excludeStaff:
    label: 'Wyklucz kadrę'
    hint: 'Pomiń kadrę (i pokoje przeznaczone wyłącznie dla kadry) w sugestiach dla tego dyżuru.'
  balanceCountries:
    label: 'Równoważ kraje'
    hint: 'Miło mieć — spróbuj rozłożyć sugerowanych uczestników pomiędzy kraje. Sprawiedliwość zawsze ma pierwszeństwo.'

action:
  cancel: 'Anuluj'
  create: 'Utwórz'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Přidat typ služby'
  edit: 'Upravit typ služby'

field:
  name:
    label: 'Název'
    rule:
      required: 'Název je povinný'
  defaultCount:
    label: 'Obvyklý počet lidí'
    hint: 'Volitelné — výchozí návrh, ne limit.'
  excludeStaff:
    label: 'Vyloučit vedoucí'
    hint: 'Nenavrhovat vedoucí (ani pokoje určené jen pro vedoucí) pro tuto službu.'
  balanceCountries:
    label: 'Vyvážit země'
    hint: 'Bonus — zkusí rozložit navrhované účastníky mezi země. Spravedlnost má vždy přednost.'

action:
  cancel: 'Zrušit'
  create: 'Vytvořit'
  save: 'Uložit'
</i18n>

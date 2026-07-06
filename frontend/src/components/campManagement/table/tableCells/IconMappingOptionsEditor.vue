<template>
  <div class="q-pa-md q-gutter-y-sm column">
    <div class="text-subtitle2">
      {{ t('mappings.label') }}
    </div>
    <div class="text-caption text-grey">
      {{ t('mappings.hint') }}
    </div>

    <q-card
      v-for="(mapping, index) in mappings"
      :key="index"
      flat
      bordered
      class="mapping-card q-pa-sm"
    >
      <div class="row no-wrap items-center q-gutter-x-sm">
        <div class="col">
          <q-select
            v-if="valueOptions"
            v-model="mapping.value"
            :label="t('value.label')"
            :hint="t('value.hint')"
            :options="valueOptions"
            emit-value
            map-options
            use-input
            fill-input
            hide-selected
            hide-bottom-space
            new-value-mode="add-unique"
            outlined
            rounded
            dense
            @new-value="createValue"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.value }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            v-else
            v-model="mapping.value"
            :label="t('value.label')"
            outlined
            rounded
            dense
          />

          <div class="q-mt-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <icon-picker
                  v-model="mapping.icon"
                  :label="t('icon.label')"
                />
              </div>
              <div class="col-6">
                <semantic-color-select
                  v-model="mapping.color"
                  :label="t('color.label')"
                />
              </div>
            </div>
          </div>
        </div>

        <q-btn
          icon="delete"
          color="negative"
          flat
          round
          dense
          @click="removeMapping(index)"
        >
          <q-tooltip>{{ t('action.remove') }}</q-tooltip>
        </q-btn>
      </div>
    </q-card>

    <q-btn
      :label="t('action.add')"
      icon="add"
      color="primary"
      flat
      dense
      rounded
      class="self-start"
      @click="addMapping"
    />

    <q-separator class="q-my-sm" />

    <div class="text-subtitle2">{{ t('fallback.label') }}</div>
    <div class="text-caption text-grey">{{ t('fallback.hint') }}</div>
    <div class="row q-col-gutter-sm">
      <div class="col-6">
        <icon-picker
          v-model="fallback.icon"
          :label="t('icon.label')"
          clearable
        />
      </div>
      <div class="col-6">
        <semantic-color-select
          v-model="fallback.color"
          :label="t('color.label')"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QSelectOption } from 'quasar';
import type { TableCellOptionsProps } from '@/components/campManagement/table/tableCells/TableCellOptionsProps';
import IconPicker from '@/components/common/inputs/IconPicker.vue';
import SemanticColorSelect from '@/components/common/inputs/SemanticColorSelect.vue';
import { FormSelectCache } from '@/components/campManagement/table/tableCells/FormSelectCache';
import { useObjectTranslation } from '@/composables/objectTranslation';
import type {
  IconMappingOptions,
  IconMapping,
  IconMappingFallback,
} from '@/components/campManagement/table/tableCells/IconMappingOptions';

const { camp, field } = defineProps<TableCellOptionsProps>();

const model = defineModel<IconMappingOptions>();

const { t } = useI18n();
const { to } = useObjectTranslation();

// When the bound form field is a select question, offer its choices as value
// suggestions. Custom values can still be added via `new-value-mode`. Falls back
// to a free-text input when the field has no known choices.
const valueOptions = computed<QSelectOption[] | undefined>(() => {
  if (!camp || !field) {
    return undefined;
  }

  const options = FormSelectCache.get(camp, field);
  if (!options) {
    return undefined;
  }

  return Object.entries(options).map(([value, label]) => ({
    value,
    label: to(label) || value,
  }));
});

function createValue(
  val: string,
  done: (item: string, mode: 'add-unique') => void,
): void {
  const trimmed = val.trim();
  if (trimmed) {
    done(trimmed, 'add-unique');
  }
}

const mappings = ref<IconMapping[]>([]);
const fallback = ref<IconMappingFallback>({
  icon: 'question_mark',
  color: 'grey',
});

// Initialise local state from the stored render options.
const stored = (model.value ?? {}) as {
  mappings?: Partial<IconMapping>[];
  fallback?: Partial<IconMappingFallback>;
};
mappings.value = Array.isArray(stored.mappings)
  ? stored.mappings.map((m) => ({
      value: String(m.value ?? ''),
      icon: m.icon ?? '',
      color: m.color ?? 'primary',
    }))
  : [];
// Default to a placeholder icon only for a brand-new mapping. Once a fallback is
// stored, honor a cleared icon (undefined) so "no fallback icon" round-trips.
fallback.value = {
  icon: stored.fallback ? stored.fallback.icon : 'question_mark',
  color: stored.fallback?.color ?? 'grey',
};

// Emit a plain object whenever the editor changes.
watch(
  [mappings, fallback],
  () => {
    model.value = {
      mappings: mappings.value.map((m) => ({ ...m })),
      fallback: { ...fallback.value },
    };
  },
  { deep: true },
);

function addMapping(): void {
  mappings.value.push({ value: '', icon: '', color: 'primary' });
}

function removeMapping(index: number): void {
  mappings.value.splice(index, 1);
}
</script>

<style scoped>
/* Allow flex columns to shrink below the inputs' intrinsic width so the
   editor never overflows the (narrow) column edit dialog. */
.col {
  min-width: 0;
}

/* Tonal container so the (filled) inputs stand out against it. */
.mapping-card {
  background: var(--md3-surface-container);
}

/* Give the outlined fields a subtle fill instead of a transparent background,
   so they read as distinct inputs on the surrounding surfaces. */
:deep(.q-field--outlined .q-field__control) {
  background: var(--md3-surface);
}
</style>

<i18n lang="yaml" locale="en">
mappings:
  label: 'Value mappings'
  hint: 'Show an icon and color for each value. The first match is used.'
value:
  label: 'Value'
  hint: 'Pick a value or type a new one'
icon:
  label: 'Icon'
color:
  label: 'Color'
fallback:
  label: 'Default'
  hint: 'Used when no mapping matches the value.'
action:
  add: 'Add mapping'
  remove: 'Remove'
</i18n>

<i18n lang="yaml" locale="de">
mappings:
  label: 'Wertzuordnungen'
  hint: 'Symbol und Farbe je Wert anzeigen. Die erste Übereinstimmung wird verwendet.'
value:
  label: 'Wert'
  hint: 'Wert auswählen oder einen neuen eingeben'
icon:
  label: 'Symbol'
color:
  label: 'Farbe'
fallback:
  label: 'Standard'
  hint: 'Wird verwendet, wenn keine Zuordnung passt.'
action:
  add: 'Zuordnung hinzufügen'
  remove: 'Entfernen'
</i18n>

<i18n lang="yaml" locale="fr">
mappings:
  label: 'Correspondances de valeurs'
  hint: 'Affiche une icône et une couleur par valeur. La première correspondance est utilisée.'
value:
  label: 'Valeur'
  hint: 'Choisir une valeur ou en saisir une nouvelle'
icon:
  label: 'Icône'
color:
  label: 'Couleur'
fallback:
  label: 'Par défaut'
  hint: "Utilisé lorsqu'aucune correspondance ne s'applique."
action:
  add: 'Ajouter une correspondance'
  remove: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
mappings:
  label: 'Przypisania wartości'
  hint: 'Pokaż ikonę i kolor dla każdej wartości. Używane jest pierwsze dopasowanie.'
value:
  label: 'Wartość'
  hint: 'Wybierz wartość lub wpisz nową'
icon:
  label: 'Ikona'
color:
  label: 'Kolor'
fallback:
  label: 'Domyślne'
  hint: 'Używane, gdy żadne przypisanie nie pasuje.'
action:
  add: 'Dodaj przypisanie'
  remove: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
mappings:
  label: 'Přiřazení hodnot'
  hint: 'Zobrazí ikonu a barvu pro každou hodnotu. Použije se první shoda.'
value:
  label: 'Hodnota'
  hint: 'Vyberte hodnotu nebo zadejte novou'
icon:
  label: 'Ikona'
color:
  label: 'Barva'
fallback:
  label: 'Výchozí'
  hint: 'Použije se, když žádné přiřazení neodpovídá.'
action:
  add: 'Přidat přiřazení'
  remove: 'Odebrat'
</i18n>

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
          <q-input
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
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import IconPicker from 'components/common/inputs/IconPicker.vue';
import SemanticColorSelect from 'components/common/inputs/SemanticColorSelect.vue';

interface Mapping {
  value: string;
  icon: string;
  color: string;
}

interface Fallback {
  icon: string;
  color: string;
}

const model = defineModel<Record<string, unknown> | undefined>();

const { t } = useI18n();

const mappings = ref<Mapping[]>([]);
const fallback = ref<Fallback>({ icon: 'question_mark', color: 'grey' });

// Initialise local state from the stored render options.
const stored = (model.value ?? {}) as {
  mappings?: Partial<Mapping>[];
  fallback?: Partial<Fallback>;
};
mappings.value = Array.isArray(stored.mappings)
  ? stored.mappings.map((m) => ({
      value: String(m.value ?? ''),
      icon: m.icon ?? '',
      color: m.color ?? 'primary',
    }))
  : [];
fallback.value = {
  icon: stored.fallback?.icon ?? 'question_mark',
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

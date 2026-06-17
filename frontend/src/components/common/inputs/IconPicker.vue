<template>
  <q-select
    v-model="model"
    :label="label"
    :options="filteredOptions"
    use-input
    fill-input
    hide-selected
    input-debounce="200"
    new-value-mode="add-unique"
    :clearable="clearable"
    outlined
    rounded
    dense
    @filter="filterFn"
  >
    <template #prepend>
      <q-icon
        v-if="model"
        :name="model"
      />
    </template>

    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-icon :name="scope.opt" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template #no-option="{ inputValue }">
      <q-item v-if="inputValue">
        <q-item-section avatar>
          <q-icon :name="inputValue" />
        </q-item-section>
        <q-item-section class="text-grey">
          {{ t('useCustom', { name: inputValue }) }}
        </q-item-section>
      </q-item>
      <q-item v-else>
        <q-item-section class="text-grey">
          {{ t('typeToSearch') }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { materialIconNames } from 'src/utils/materialIcons';

defineProps<{
  label?: string | undefined;
  clearable?: boolean | undefined;
}>();

const model = defineModel<string | undefined>();

const { t } = useI18n();

// Full Material Icons set is ~2100 entries. Rendering all of them (each with a
// rendered glyph) is wasteful, so we only show a capped slice of matches and
// rely on the search input to narrow things down. Any name can still be entered
// manually via `new-value-mode`.
const MAX_RESULTS = 50;

// Shown before the user starts typing — alphabetical order would otherwise
// surface obscure icons like `10k` first.
const COMMON_ICONS: string[] = [
  'person',
  'group',
  'groups',
  'check',
  'check_circle',
  'close',
  'cancel',
  'done',
  'schedule',
  'hourglass_top',
  'star',
  'flag',
  'favorite',
  'thumb_up',
  'thumb_down',
  'warning',
  'error',
  'info',
  'help',
  'question_mark',
  'priority_high',
  'block',
  'verified',
  'lock',
  'lock_open',
  'visibility',
  'visibility_off',
  'home',
  'directions_walk',
  'escalator_warning',
];

const filteredOptions = ref<string[]>(COMMON_ICONS);

function filterFn(val: string, update: (cb: () => void) => void): void {
  update(() => {
    const needle = val.toLowerCase();
    if (!needle) {
      filteredOptions.value = COMMON_ICONS;
      return;
    }
    filteredOptions.value = materialIconNames
      .filter((icon) => icon.includes(needle))
      .slice(0, MAX_RESULTS);
  });
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
useCustom: 'Use "{name}"'
typeToSearch: 'Type to search icons…'
</i18n>

<i18n lang="yaml" locale="de">
useCustom: '"{name}" verwenden'
typeToSearch: 'Zum Suchen tippen…'
</i18n>

<i18n lang="yaml" locale="fr">
useCustom: 'Utiliser « {name} »'
typeToSearch: 'Saisir pour rechercher…'
</i18n>

<i18n lang="yaml" locale="pl">
useCustom: 'Użyj „{name}”'
typeToSearch: 'Wpisz, aby wyszukać…'
</i18n>

<i18n lang="yaml" locale="cs">
useCustom: 'Použít „{name}“'
typeToSearch: 'Pište pro vyhledávání…'
</i18n>

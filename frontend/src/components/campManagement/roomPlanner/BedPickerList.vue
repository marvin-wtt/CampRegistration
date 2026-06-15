<template>
  <div class="bed-picker">
    <q-input
      v-model="filter"
      class="bed-picker__search"
      dense
      borderless
      clearable
      :autofocus="autofocus"
      :placeholder="t('search')"
    >
      <template #prepend>
        <q-icon
          name="search"
          size="20px"
        />
      </template>
    </q-input>

    <q-separator />

    <q-list class="bed-picker__list">
      <q-item
        v-if="removable"
        clickable
        class="bed-picker__remove"
        @click="emit('clear')"
      >
        <q-item-section avatar>
          <q-icon
            name="person_remove"
            size="20px"
          />
        </q-item-section>
        <q-item-section>
          {{ t('remove') }}
        </q-item-section>
      </q-item>

      <q-separator v-if="removable && filteredOptions.length > 0" />

      <q-item
        v-for="person in filteredOptions"
        :key="person.id"
        clickable
        @click="emit('select', person)"
      >
        <q-item-section avatar>
          <country-icon
            v-if="person.country"
            :country="person.country"
          />
          <q-icon
            v-else
            name="person"
            size="20px"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label class="ellipsis">
            {{ person.name }}
          </q-item-label>
        </q-item-section>
        <q-item-section
          v-if="person.age !== undefined"
          side
        >
          {{ person.age }}
        </q-item-section>
      </q-item>

      <div
        v-if="filteredOptions.length === 0"
        class="bed-picker__empty"
      >
        {{ t('noMatch') }}
      </div>
    </q-list>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import type { Roommate } from 'src/types/Room';

const { t } = useI18n();

const {
  options,
  removable = false,
  autofocus = false,
} = defineProps<{
  options: Roommate[];
  removable?: boolean;
  autofocus?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', person: Roommate): void;
  (e: 'clear'): void;
}>();

const filter = ref<string>('');

const filteredOptions = computed<Roommate[]>(() => {
  const needle = filter.value?.trim().toLowerCase();
  if (!needle) {
    return options;
  }

  return options.filter((person) => person.name.toLowerCase().includes(needle));
});
</script>

<style scoped>
.bed-picker {
  min-width: 240px;
}

.bed-picker__search {
  padding: 0 16px;
}

.bed-picker__list {
  max-height: 280px;
  overflow: auto;
  padding: 4px 0;
}

.bed-picker__remove {
  color: var(--md3-error);
}

.bed-picker__empty {
  padding: 16px;

  color: var(--md3-on-surface-variant);

  font-size: 13px;
  text-align: center;
}
</style>

<i18n lang="yaml" locale="en">
search: 'Search people'
remove: 'Remove from bed'
noMatch: 'No matching people'
</i18n>

<i18n lang="yaml" locale="de">
search: 'Personen suchen'
remove: 'Aus dem Bett entfernen'
noMatch: 'Keine passenden Personen'
</i18n>

<i18n lang="yaml" locale="fr">
search: 'Rechercher des personnes'
remove: 'Retirer du lit'
noMatch: 'Aucune personne correspondante'
</i18n>

<i18n lang="yaml" locale="pl">
search: 'Szukaj osób'
remove: 'Usuń z łóżka'
noMatch: 'Brak pasujących osób'
</i18n>

<i18n lang="yaml" locale="cs">
search: 'Hledat osoby'
remove: 'Odebrat z lůžka'
noMatch: 'Žádné odpovídající osoby'
</i18n>

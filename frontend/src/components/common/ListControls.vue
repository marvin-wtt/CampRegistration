<template>
  <!-- A list's search, filters and sort. Wide: one row with a search of
       its own size. Phones: search and buttons, the filters below. -->
  <div class="list-controls-wrap">
    <div
      class="list-controls row items-center"
      :class="quasar.screen.xs ? 'list-controls--xs' : 'list-controls--wide'"
    >
      <q-input
        v-model="search"
        :placeholder
        class="list-search"
        outlined
        rounded
        dense
        clearable
        debounce="150"
        :data-test="`${testId}-search`"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <slot />
      <div
        v-if="$slots.filters"
        class="list-filters row items-center"
      >
        <slot name="filters" />
      </div>
      <m-btn
        icon="sort"
        class="list-sort"
        color="on-surface-variant"
        flat
        round
        :aria-label="t('sort')"
        :data-test="`${testId}-sort`"
      >
        <q-tooltip>{{ t('sort') }}</q-tooltip>
        <q-menu auto-close>
          <q-list style="min-width: 220px">
            <q-item
              v-for="option in sorts"
              :key="option.value"
              clickable
              :active="sort === option.value"
              :data-test="`${testId}-sort-${option.value}`"
              @click="sort = option.value"
            >
              <q-item-section>{{ option.label }}</q-item-section>
              <q-item-section
                v-if="sort === option.value"
                side
              >
                <q-icon name="check" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </m-btn>
    </div>
  </div>
</template>

<script lang="ts" setup generic="T extends string">
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { sorts, placeholder, testId } = defineProps<{
  sorts: readonly { value: T; label: string }[];
  placeholder: string;
  /** Prefix of the controls' data-test ids. */
  testId: string;
}>();

const search = defineModel<string | null>('search', { required: true });
const sort = defineModel<T>('sort', { required: true });

const { t } = useI18n();
const quasar = useQuasar();
</script>

<style scoped>
/* Sized by the space it has, not the screen: a page with a rail leaves
   less room than the viewport suggests. */
.list-controls-wrap {
  container-type: inline-size;
}

.list-controls {
  gap: 8px;
}

.list-controls--wide .list-search {
  flex: 0 1 320px;
  min-width: 200px;
}

.list-controls--wide .list-filters {
  flex: 1 1 0;
  min-width: 0;
  gap: 8px;
}

.list-controls--wide .list-sort {
  margin-left: auto;
}

/* Too narrow for one row: search and sort on top, the filters below. */
@container (max-width: 960px) {
  .list-controls--wide .list-filters {
    order: 1;
    flex: 1 0 100%;
  }
}

/* Phones: search fills the first row, the filters take the next. */
.list-controls--xs .list-search {
  flex: 1 1 0;
  min-width: 0;
}

.list-controls--xs .list-filters {
  order: 1;
  flex: 1 0 100%;
  gap: 8px;
  overflow-x: auto;
  flex-wrap: nowrap;
  scrollbar-width: none;
}
</style>

<i18n lang="yaml" locale="en">
sort: 'Sort'
</i18n>

<i18n lang="yaml" locale="de">
sort: 'Sortieren'
</i18n>

<i18n lang="yaml" locale="fr">
sort: 'Trier'
</i18n>

<i18n lang="yaml" locale="pl">
sort: 'Sortuj'
</i18n>

<i18n lang="yaml" locale="cs">
sort: 'Seřadit'
</i18n>

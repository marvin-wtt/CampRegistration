<template>
  <q-td :props="props.props">
    <div
      v-if="expand"
      class="column"
    >
      <div
        v-for="[locale, value] in Object.entries(text)"
        :key="locale"
        class="row content-center no-wrap"
      >
        <country-icon
          :locale
          class="q-pr-md"
        />

        <span class="self-center">
          {{ value }}
        </span>
      </div>
    </div>

    <template v-else>
      {{ to(text) }}
    </template>
  </q-td>
</template>

<script lang="ts" setup>
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { computed } from 'vue';
import { Translatable } from '@camp-registration/common/entities';

const { to } = useObjectTranslation();

const props = defineProps<{
  props: QTableBodyCellProps<Translatable>;
}>();

const expand = computed<boolean>(() => {
  return props.props.expand && typeof text.value !== 'string';
});

const text = computed<Translatable>(() => {
  const value = props.props.value;
  if (typeof value === 'string') {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce(
      (obj, key) => {
        obj[key] = value[key];
        return obj;
      },
      {} as Record<string, string>,
    );
});
</script>

<style scoped></style>

<template>
  <q-list separator>
    <template v-if="loading">
      <results-item-skeleton
        v-for="index in 3"
        :key="index"
        :public="props.public"
      />
    </template>

    <q-item
      v-else-if="props.camps.length === 0"
      class="text-center vertical-middle"
    >
      <q-item-section>
        {{ t('no_data') }}
      </q-item-section>
    </q-item>

    <results-item
      v-for="camp in props.camps"
      v-else
      :key="camp.id"
      :camp="camp"
      :public="props.public"
    />
  </q-list>
</template>

<script lang="ts" setup>
import ResultsItem from 'components/campManagement/index/ResultsItem.vue';
import { Camp } from 'src/types/Camp';
import { useI18n } from 'vue-i18n';
import ResultsItemSkeleton from 'components/campManagement/index/ResultsItemSkeleton.vue';

const { t } = useI18n();

interface Props {
  camps: Camp[];
  public?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  public: false,
  loading: false,
});
</script>

<style scoped></style>

<!-- TODO Translate -->
<i18n lang="yaml" locale="en">
no_data: 'No data found'
</i18n>

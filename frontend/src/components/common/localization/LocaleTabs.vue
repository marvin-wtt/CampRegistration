<template>
  <q-tabs
    v-model="model"
    align="left"
    dense
    no-caps
    mobile-arrows
    outside-arrows
    active-color="primary"
    indicator-color="primary"
    class="text-on-surface-variant"
  >
    <q-tab
      v-for="loc in locales"
      :key="loc"
      :name="loc"
    >
      <div class="row items-center no-wrap q-gutter-xs">
        <country-icon :locale="loc" />
        <span class="text-caption text-weight-medium">
          {{ loc.toUpperCase() }}
        </span>
        <q-icon
          v-if="filled?.includes(loc)"
          name="check"
          size="14px"
          class="text-positive"
        />
      </div>
    </q-tab>
  </q-tabs>
</template>

<script lang="ts" setup>
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { APP_LOCALES } from '@/i18n/locales';

const model = defineModel<string>({ required: true });

withDefaults(
  defineProps<{
    locales?: string[];
    /** Locales that already have content, marked so gaps are visible at a glance. */
    filled?: string[] | undefined;
  }>(),
  {
    locales: () => [...APP_LOCALES],
    filled: undefined,
  },
);
</script>

<template>
  <q-skeleton
    v-if="campDetailStore.isLoading"
    type="rect"
    :height="rail ? '32px' : '2.5em'"
    :width="rail ? '60px' : '12em'"
    :class="rail ? 'rounded-lg' : 'q-ml-xs'"
  />

  <!-- Rail: compact pill with a chevron + the current camp name beneath,
       so it clearly reads as "current camp, tap to switch". -->
  <div
    v-else-if="rail"
    class="camp-switcher-rail column items-center"
  >
    <m-btn
      tonal
      no-morph
      :aria-label="t('switch_camp')"
      class="camp-switcher-rail__btn rounded-lg"
    >
      <q-icon
        name="cabin"
        size="20px"
      />
      <q-icon
        name="arrow_drop_down"
        size="18px"
      />

      <q-tooltip
        anchor="center right"
        self="center left"
      >
        {{ t('switch_camp') }}
      </q-tooltip>

      <q-menu
        anchor="bottom start"
        self="top start"
      >
        <camp-switcher-menu />
      </q-menu>
    </m-btn>

    <div class="camp-switcher-rail__name ellipsis">
      {{ switcherLabel }}
    </div>
  </div>

  <!-- Bar: width-constrained toolbar control with a truncating label + caret. -->
  <m-btn
    v-else
    tonal
    no-caps
    no-morph
    :aria-label="switcherLabel"
    class="camp-switcher"
  >
    <span class="camp-switcher__label">
      {{ switcherLabel }}
    </span>
    <q-icon
      name="arrow_drop_down"
      size="20px"
      class="camp-switcher__chevron on-right"
    />

    <q-tooltip>
      {{ switcherLabel }}
    </q-tooltip>

    <q-menu
      anchor="bottom start"
      self="top start"
    >
      <camp-switcher-menu />
    </q-menu>
  </m-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import CampSwitcherMenu from '@/components/layout/CampSwitcherMenu.vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

defineProps<{
  // Render as a compact pill for the navigation rail.
  rail?: boolean;
}>();

const { t } = useI18n();
const { to } = useObjectTranslation();

const campDetailStore = useCampDetailsStore();

const campName = computed<string | undefined>(() => {
  return to(campDetailStore.data?.name);
});

const switcherLabel = computed<string>(() => {
  return campName.value || t('app_name');
});
</script>

<style scoped>
.camp-switcher {
  min-width: 0;
}

.camp-switcher :deep(.q-btn__content) {
  flex-wrap: nowrap;
  min-width: 0;
  max-width: 100%;
}

.camp-switcher__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.camp-switcher__chevron {
  flex: 0 0 auto;
  margin-left: 6px;
}

.camp-switcher-rail__btn {
  min-height: 32px;
  padding: 0 6px;
}

.camp-switcher-rail__name {
  max-width: 84px;
  margin-top: 4px;

  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
switch_camp: 'Switch camp'
</i18n>

<i18n lang="yaml" locale="de">
switch_camp: 'Camp wechseln'
</i18n>

<i18n lang="yaml" locale="fr">
switch_camp: 'Changer de camp'
</i18n>

<i18n lang="yaml" locale="pl">
switch_camp: 'Zmień obóz'
</i18n>

<i18n lang="yaml" locale="cs">
switch_camp: 'Změnit tábor'
</i18n>

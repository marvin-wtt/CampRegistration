<template>
  <div
    ref="rootRef"
    class="row items-center justify-center no-wrap"
  >
    <q-btn
      :aria-label="t('actions')"
      icon="more_vert"
      round
      flat
      size="sm"
    >
      <q-menu>
        <row-action-list :actions="visibleActions" />
      </q-menu>
    </q-btn>

    <!-- Right-click (or long-press) anywhere on the surrounding table row -->
    <q-menu
      v-if="visibleActions.length > 0"
      :target="rowEl ?? false"
      context-menu
      touch-position
    >
      <row-action-list :actions="visibleActions" />
    </q-menu>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import RowActionList from '@/components/administration/RowActionList.vue';

export interface RowAction {
  key: string;
  label: string;
  icon: string;
  color?: string;
  hidden?: boolean;
  separatorBefore?: boolean;
  handler: () => void;
}

const { actions } = defineProps<{
  actions: RowAction[];
}>();

const { t } = useI18n();

const rootRef = ref<HTMLElement | null>(null);
const rowEl = ref<HTMLElement | null>(null);

onMounted(() => {
  rowEl.value = rootRef.value?.closest('tr') ?? null;
});

const visibleActions = computed<RowAction[]>(() =>
  actions.filter((action) => !action.hidden),
);
</script>

<i18n lang="yaml" locale="en">
actions: 'Actions'
</i18n>

<i18n lang="yaml" locale="de">
actions: 'Aktionen'
</i18n>

<i18n lang="yaml" locale="fr">
actions: 'Actions'
</i18n>

<i18n lang="yaml" locale="pl">
actions: 'Akcje'
</i18n>

<i18n lang="yaml" locale="cs">
actions: 'Akce'
</i18n>

<template>
  <div class="row items-center justify-center no-wrap">
    <q-btn
      :aria-label="t('actions')"
      icon="more_vert"
      round
      flat
      size="sm"
    >
      <q-menu>
        <q-list style="min-width: 160px">
          <template
            v-for="(action, index) in visibleActions"
            :key="action.key"
          >
            <q-separator v-if="action.separatorBefore && index > 0" />
            <q-item
              v-close-popup
              clickable
              :class="action.color ? `text-${action.color}` : undefined"
              @click="action.handler"
            >
              <q-item-section avatar>
                <q-icon :name="action.icon" />
              </q-item-section>
              <q-item-section>{{ action.label }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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

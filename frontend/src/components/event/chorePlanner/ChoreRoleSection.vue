<template>
  <!-- One role of a duty: how many it needs, fair picks, then who is on it. -->
  <div class="section rounded-lg q-pa-sm column no-wrap q-gutter-y-sm">
    <div class="controls row items-center justify-between">
      <div class="controls row items-center no-wrap">
        <span class="text-body2">{{ countLabel }}</span>
        <chore-count-stepper
          v-model="count"
          :label="countLabel"
        />
      </div>
      <q-btn
        v-if="showAutoFill"
        icon="auto_awesome"
        :label="t('autoFill')"
        color="primary"
        outline
        rounded
        no-caps
        :disable="!canAutoFill"
        :loading="autoFilling"
        @click="emit('autofill')"
      />
    </div>

    <!-- Role-specific extras, e.g. suggestions. -->
    <slot />

    <q-select
      v-model="selected"
      :label="label"
      :hint="hint"
      :options="options"
      map-options
      emit-value
      multiple
      use-chips
      use-input
      input-debounce="0"
      outlined
      rounded
      @filter="(value, update) => emit('filter', value, update)"
    >
      <template #prepend>
        <q-icon :name="icon" />
      </template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label
              v-if="scope.opt.caption"
              caption
            >
              {{ scope.opt.caption }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <template #selected-item="scope">
        <q-chip
          removable
          dense
          :class="{ 'member-missed': isMissed(scope.opt.value) }"
          @remove="scope.removeAtIndex(scope.index)"
        >
          {{ scope.opt.label }}
        </q-chip>
      </template>
    </q-select>
  </div>
</template>

<script lang="ts" setup>
import type { QSelectOption } from 'quasar';
import { useI18n } from 'vue-i18n';
import ChoreCountStepper from '@/components/event/chorePlanner/ChoreCountStepper.vue';

defineProps<{
  countLabel: string;
  label: string;
  icon: string;
  options: QSelectOption[];
  hint?: string | undefined;
  isMissed: (registrationId: string) => boolean;
  // Hidden for done or cancelled duties, disabled while nothing is open.
  showAutoFill: boolean;
  canAutoFill: boolean;
  autoFilling: boolean;
}>();

const count = defineModel<number>('count', { required: true });
const selected = defineModel<string[]>({ required: true });

const emit = defineEmits<{
  autofill: [];
  filter: [value: string, update: (fn: () => void) => void];
}>();

const { t } = useI18n();
</script>

<style scoped>
.section {
  border: 1px solid var(--md3-outline-variant);
}

.controls {
  gap: 8px;
}

.member-missed {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>

<i18n lang="yaml" locale="en">
autoFill: 'Fill fairly'
</i18n>

<i18n lang="yaml" locale="de">
autoFill: 'Fair besetzen'
</i18n>

<i18n lang="yaml" locale="fr">
autoFill: 'Remplir équitablement'
</i18n>

<i18n lang="yaml" locale="pl">
autoFill: 'Obsadź sprawiedliwie'
</i18n>

<i18n lang="yaml" locale="cs">
autoFill: 'Obsadit spravedlivě'
</i18n>

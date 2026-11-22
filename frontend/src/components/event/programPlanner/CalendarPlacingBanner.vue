<template>
  <div
    class="placing-banner row no-wrap items-center rounded-xl elevation-3"
    role="status"
    data-test="program-placing-banner"
  >
    <q-icon
      name="touch_app"
      size="20px"
      class="col-auto"
    />
    <div class="placing-banner__text col">
      <div class="text-body2 ellipsis-2-lines">
        {{ t('hint', { title }) }}
      </div>
      <div
        v-if="item.duration"
        class="placing-banner__duration text-caption"
      >
        {{ formatProgramItemDuration(item.duration, locale) }}
      </div>
    </div>
    <q-btn
      class="col-auto"
      icon="close"
      color="inverse-primary"
      flat
      round
      dense
      :aria-label="t('cancel')"
      data-test="program-placing-cancel"
      @click="emit('cancel')"
    >
      <q-tooltip>{{ t('cancel') }}</q-tooltip>
    </q-btn>
  </div>
</template>

<script lang="ts" setup>
import type { ProgramItem } from '@camp-registration/common/entities';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatProgramItemDuration } from '@/utils/programItem';

const { t, locale } = useI18n();
const { to, toAll } = useObjectTranslation();

const { item, showAllTranslations = false } = defineProps<{
  item: ProgramItem;
  showAllTranslations?: boolean;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
}>();

const title = computed<string>(() =>
  showAllTranslations ? toAll(item.title) : to(item.title),
);
</script>

<style lang="scss" scoped>
.placing-banner {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: min(480px, calc(100% - 16px));
  gap: 12px;
  padding: 8px 8px 8px 16px;
  z-index: 10;
  background: var(--md3-inverse-surface);
  color: var(--md3-inverse-on-surface);
}

// Lets the text shrink and wrap instead of pushing under the button
.placing-banner__text {
  min-width: 0;
  overflow-wrap: anywhere;
}

.placing-banner__duration {
  opacity: 0.8;
}
</style>

<i18n lang="yaml" locale="en">
hint: 'Pick a time or a day for "{title}"'
cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
hint: 'Wähle eine Uhrzeit oder einen Tag für „{title}“'
cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
hint: 'Choisissez une heure ou un jour pour « {title} »'
cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
hint: 'Wybierz godzinę lub dzień dla „{title}”'
cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
hint: 'Vyberte čas nebo den pro „{title}“'
cancel: 'Zrušit'
</i18n>

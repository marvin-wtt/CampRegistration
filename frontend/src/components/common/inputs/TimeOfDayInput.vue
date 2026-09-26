<template>
  <q-input
    v-model="model"
    mask="time"
    v-bind="inputProps"
    @focus="onFocus"
  >
    <template #append>
      <q-icon
        class="cursor-pointer"
        name="schedule"
      >
        <q-popup-proxy
          ref="popup"
          cover
          transition-hide="scale"
          transition-show="scale"
        >
          <q-time
            v-model="model"
            mask="HH:mm"
            format24h
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                color="primary"
                flat
                :label="t('close')"
              />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>

    <!-- Parent slots -->
    <template
      v-for="(_, name) in slots"
      :key="name"
      #[name]
    >
      <slot :name />
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { type QInputProps, type QPopupProxy, useQuasar } from 'quasar';
import {
  type ForwardedFieldSlots,
  usePassthroughProps,
} from '@/composables/passthroughProps';

const { t } = useI18n();
const quasar = useQuasar();

type Props = Omit<
  QInputProps,
  'modelValue' | 'onUpdate:modelValue' | 'mask' | 'onFocus'
>;

const model = defineModel<string | null | undefined>();
const slots = defineSlots<ForwardedFieldSlots>();

const props = defineProps<Props>();

const inputProps = usePassthroughProps(props);

const popup = useTemplateRef<QPopupProxy>('popup');

// On desktop, focus fires on Tab too — auto-opening there would pop the
// picker over every field a keyboard user tabs past. Touch devices get no
// such drive-by focus, and typing into a masked field is awkward, so only
// they open on focus; everyone else uses the icon.
function onFocus() {
  if (quasar.platform.has.touch) {
    popup.value?.show();
  }
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
close: 'Zavřít'
</i18n>

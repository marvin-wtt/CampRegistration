<template>
  <page-state-handler
    :error
    :loading
    class="flex justify-center"
  >
    <q-form
      class="q-gutter-y-md column q-pa-md"
      greedy
      style="width: 400px"
      @reset="onReset"
      @submit="onSubmit"
    >
      <a class="text-h4">
        {{ t('title.create') }}
      </a>

      <!-- Countries -->
      <country-select
        v-model="camp.countries"
        :disable="loading"
        :label="t('field.countries')"
        :countries="['de', 'fr', 'gb', 'pl', 'cz']"
        :rules="[
          (val?: string[]) =>
            (val && val.length > 0) || t('validation.countries.empty'),
        ]"
        hide-bottom-space
        outlined
        rounded
        multiple
      >
        <template #before>
          <q-icon name="language" />
        </template>
      </country-select>

      <!-- name -->
      <translated-input
        v-model="camp.name"
        :disable="loading"
        :label="t('field.name')"
        :locales="camp.countries"
        :rules="[
          (val?: string) => !!val || t('validation.name.empty'),
          (val: string) => val.length <= 255 || t('validation.name.length'),
        ]"
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <q-icon name="title" />
        </template>
      </translated-input>

      <!-- organizer -->
      <translated-input
        v-model="camp.organizer"
        :disable="loading"
        :label="t('field.organizer')"
        :locales="camp.countries"
        :rules="[
          (val?: string) => !!val || t('validation.organizer.empty'),
          (val: string) =>
            val.length <= 255 || t('validation.organizer.length'),
        ]"
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <q-icon name="corporate_fare" />
        </template>
      </translated-input>

      <!-- contact email -->
      <translated-input
        v-model="camp.contactEmail"
        :disable="loading"
        :label="t('field.contactEmail')"
        :locales="camp.countries"
        :rules="[(val?: string) => !!val || t('validation.contactEmail.empty')]"
        type="email"
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <q-icon name="email" />
        </template>
      </translated-input>

      <!-- dates -->
      <date-range-input
        v-model:from="camp.startAt"
        v-model:to="camp.endAt"
        :disable="loading"
        :label="t('field.dateRange')"
        :rules="[(val?: string) => !!val || t('validation.dateRange.empty')]"
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <q-icon name="event" />
        </template>
      </date-range-input>

      <!-- Times -->
      <div class="row">
        <time-input
          v-model="camp.startAt"
          :disable="loading"
          :label="t('field.startTime')"
          :rules="[(val?: string) => !!val || t('validation.startAt.empty')]"
          class="col-xs-12 col-sm-6 col-md-6 col-lg-6 col-xl-6"
          hide-bottom-space
          outlined
          rounded
        >
          <template #before>
            <q-icon name="schedule" />
          </template>
        </time-input>

        <time-input
          v-model="camp.endAt"
          :disable="loading"
          :label="t('field.endTime')"
          :rules="[(val?: string) => !!val || t('validation.endAt.empty')]"
          class="col-xs-12 col-sm-6 col-md-6 col-lg-6 col-xl-6"
          hide-bottom-space
          outlined
          rounded
        >
          <template #before>
            <!-- Invalid name for spacing -->
            <q-icon name="none" />
          </template>
        </time-input>
      </div>

      <!-- Registration window -->
      <date-time-input
        v-model="camp.registrationOpensAt"
        :disable="loading"
        :label="t('field.registrationOpensAt')"
        :rules="[
          (val?: string | null) =>
            !val ||
            !camp.registrationClosesAt ||
            val < camp.registrationClosesAt ||
            t('validation.registrationOpensAt.before_close'),
        ]"
        clearable
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <q-icon name="lock_open" />
        </template>
      </date-time-input>

      <date-time-input
        v-model="camp.registrationClosesAt"
        :disable="loading"
        :label="t('field.registrationClosesAt')"
        :rules="[
          (val?: string | null) =>
            !val ||
            !camp.registrationOpensAt ||
            val > camp.registrationOpensAt ||
            t('validation.registrationClosesAt.after_open'),
        ]"
        clearable
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <q-icon name="lock" />
        </template>
      </date-time-input>

      <!-- participants -->
      <translated-input
        v-model.number="camp.maxParticipants"
        :disable="loading"
        :label="t('field.maxParticipants')"
        :locales="camp.countries"
        :rules="[
          (val?: number) => !!val || t('validation.maxParticipants.empty'),
          (val: number) => val >= 0 || t('validation.maxParticipants.positive'),
        ]"
        always
        hide-bottom-space
        outlined
        rounded
        type="number"
      >
        <template #before>
          <q-icon name="group" />
        </template>
      </translated-input>

      <!-- age -->
      <!-- minAge -->
      <q-input
        v-model.number="camp.minAge"
        :disable="loading"
        :label="t('field.minAge')"
        :rules="[
          (val?: number) => !!val || t('validation.minAge.empty'),
          (val: number) => val > 0 || t('validation.minAge.positive'),
          (val: number) => val < 100 || t('validation.minAge.max'),
        ]"
        hide-bottom-space
        outlined
        rounded
        type="number"
      >
        <template #before>
          <q-icon name="remove" />
        </template>
      </q-input>

      <!-- maxAge -->
      <q-input
        v-model.number="camp.maxAge"
        :disable="loading"
        :label="t('field.maxAge')"
        :rules="[
          (val?: number) => !!val || t('validation.maxAge.empty'),
          (val: number) =>
            (camp.minAge && val >= camp.minAge) || t('validation.maxAge.min'),
          (val: number) => val < 100 || t('validation.minAge.max'),
        ]"
        hide-bottom-space
        outlined
        rounded
        type="number"
      >
        <template #before>
          <q-icon name="add" />
        </template>
      </q-input>

      <!-- Admission mode -->
      <q-select
        v-model="camp.confirmationMode"
        :label="t('field.confirmation_mode')"
        :options="confirmationModeOptions"
        map-options
        emit-value
        outlined
        rounded
      >
        <template #before>
          <q-icon name="how_to_reg" />
        </template>
      </q-select>

      <!-- location -->
      <translated-input
        v-model="camp.location"
        :disable="loading"
        :label="t('field.location')"
        :locales="camp.countries"
        :rules="[
          (val?: string) => !!val || t('validation.location.empty'),
          (val: string) => val.length < 255 || t('validation.location.length'),
        ]"
        hide-bottom-space
        outlined
        rounded
      >
        <template #before>
          <q-icon name="map" />
        </template>
      </translated-input>

      <!-- price -->
      <q-input
        v-model.number="camp.price"
        :disable="loading"
        :label="t('field.price')"
        :rules="[
          (val?: number) => !!val || val === 0 || t('validation.price.empty'),
          (val: number) => val >= 0 || t('validation.price.positive'),
        ]"
        hide-bottom-space
        input-class="text-right"
        outlined
        rounded
        suffix="€"
        type="number"
      >
        <template #before>
          <q-icon name="euro" />
        </template>
      </q-input>

      <!-- Public -->
      <q-toggle
        v-model="camp.public"
        :label="t('field.public')"
      />

      <!-- action -->
      <div class="row justify-end">
        <q-btn
          :label="t('action.reset')"
          :disable="loading"
          class="q-ml-sm"
          color="primary"
          flat
          rounded
          type="reset"
        />
        <q-btn
          :label="t('action.submit.edit')"
          :loading
          color="primary"
          rounded
          type="submit"
        />
      </div>
    </q-form>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import type { Camp, CampDetails } from '@camp-registration/common/entities';
import { useRoute, useRouter } from 'vue-router';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { storeToRefs } from 'pinia';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import TimeInput from 'components/common/inputs/TimeInput.vue';
import CountrySelect from 'components/common/CountrySelect.vue';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';
import DateRangeInput from 'components/common/inputs/DateRangeInput.vue';
import DateTimeInput from 'components/common/inputs/DateTimeInput.vue';
import { useI18n } from 'vue-i18n';
import type { QSelectOption } from 'quasar';
import { deepToRaw } from 'src/utils/deepToRaw';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const campStore = useCampDetailsStore();
const { data, error, isLoading } = storeToRefs(campStore);

const camp = ref<CampDetails>(initialValue());
const updating = ref<boolean>(false);

onMounted(async () => {
  await Promise.allSettled([campStore.fetchData()]);
});

const loading = computed(() => isLoading.value || updating.value);

const confirmationModeOptions = computed<
  QSelectOption<CampDetails['confirmationMode']>[]
>(() => {
  return [
    {
      label: t('confirmation_mode.automatic'),
      value: 'AUTOMATIC',
    },
    {
      label: t('confirmation_mode.manual'),
      value: 'MANUAL',
    },
  ];
});

function initialValue(): CampDetails {
  const camp = structuredClone(deepToRaw(data.value!));
  camp.public = camp.public ?? false;

  return camp;
}

function onReset() {
  camp.value = initialValue();
}

watch(data, (value) => {
  if (value) {
    camp.value = value;
  }
});

async function onSubmit() {
  updating.value = true;
  const value: Camp | undefined = camp.value;

  if (value === undefined) {
    return;
  }

  const newCamp = await campStore.updateData(value);
  if (!newCamp) {
    updating.value = false;
    return;
  }

  return router.push({
    name: 'management.camp',
    params: { campId: route.params.campId },
  });
}
</script>

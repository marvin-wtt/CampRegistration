<template>
  <q-card
    v-ripple
    class="camp-card cursor-pointer q-hoverable"
    data-test="camp-card"
    @click="navigateToRegistration"
  >
    <!-- Helper to make it hover and selectable -->
    <span class="q-focus-helper" />
    <!-- Image -->
    <q-card-section class="col q-pa-none">
      <!-- TODO Use actual logo -->
      <q-img
        src="https://via.placeholder.com/1024x768/eee?text=4:3"
        alt="Logo"
        :ratio="4 / 3"
        :fit="'cover'"
      />
    </q-card-section>

    <!-- Content -->
    <div class="col">
      <q-card-section class="column items-start">
        <div class="col text-caption">
          {{ formatDate(props.camp.startAt) }} -
          {{ formatDate(props.camp.endAt) }}
        </div>
        <div class="col text-h5">
          {{ to(props.camp.name) }}
        </div>
        <div class="col text-caption">
          {{ to(props.camp.organizer) }}
        </div>
      </q-card-section>
      <q-card-section class="column q-pt-none">
        <div>
          <q-icon
            name="place"
            size="sm"
          />
          {{ to(props.camp.location) }}
        </div>
        <div>
          <q-icon
            name="person"
            size="sm"
          />
          {{ props.camp.minAge }} - {{ props.camp.maxAge }} years
        </div>
        <div class="col q-col-gutter-sm">
          <q-icon
            name="language"
            size="sm"
          />
          <country-icon
            v-for="locale in props.camp.countries"
            :key="locale"
            :locale="locale"
          />
        </div>
        <div>
          <q-icon
            name="attach_money"
            size="sm"
          />
          {{ props.camp.price }} €
        </div>
      </q-card-section>
    </div>
  </q-card>
</template>

<script lang="ts" setup>
import type { Camp } from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useRouter } from 'vue-router';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

const { to } = useObjectTranslation();
const router = useRouter();

interface Props {
  camp: Camp;
}

const props = defineProps<Props>();

function formatDate(dateString: string | Date) {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;

  return date.toLocaleDateString();
}

function navigateToRegistration() {
  router.push({
    name: 'camp',
    params: {
      camp: props.camp.id,
    },
  });
}
</script>

<style scoped>
.camp-card {
  width: 300px;
  max-width: 300px;
}
</style>

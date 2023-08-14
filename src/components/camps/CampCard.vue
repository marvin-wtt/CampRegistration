<template>
  <q-card
    class="camp-card"
    @click="navigateToRegistration"
  >
    <q-card-section class="row items-start">
      <q-avatar>
        <!-- TODO add logo -->
        <img
          src="camp-image-url"
          alt="logo"
        />
      </q-avatar>
      <div class="q-ml-md">
        <q-badge color="secondary">
          {{ formatDate(props.camp.startAt) }} - {{ formatDate(props.camp.endAt) }}
        </q-badge>
        <div class="camp-name">
          {{ to(props.camp.name) }}
        </div>
      </div>
    </q-card-section>

    <q-card-section class="row reverse-wrap justify-between">
      <div class='col-md-8'>
        <div class="camp-location">
          {{ to(props.camp.location) }}
        </div>
        <div class="camp-countries">
          <!-- TODO Style -->
          {{ props.camp.countries }}
        </div>
      </div>
      <div class="col">
        <div>
          <q-icon name='place' size='sm' />
          {{ to(props.camp.location) }}
        </div>

        <div>
          <q-icon name="attach_money" size="sm" />
          {{ props.camp.price }} €
        </div>
        <div>
          <q-icon name="person" size="sm" />
          {{ props.camp.minAge }} - {{ props.camp.maxAge }} years
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        label="Register Now"
        color="primary"
        rounded
        flat
        @click="navigateToRegistration"
      />
    </q-card-actions>
  </q-card>

  <!--  <q-card>-->
  <!--    <q-card-section>-->
  <!--      <div class="text-h6">-->
  <!--        {{ to(props.camp.name) }}-->
  <!--      </div>-->
  <!--    </q-card-section>-->
  <!--    Test-->
  <!--  </q-card>-->
</template>

<script lang="ts" setup>
import { Camp } from 'src/types/Camp';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useRouter } from 'vue-router';

const { to } = useObjectTranslation();
const router = useRouter();

interface Props {
  camp: Camp;
}

const props = defineProps<Props>();

function formatDate(dateString) {
  const date = new Date(dateString);

  // TODO Handle time zones
  return date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
    ? date.toLocaleDateString()
    : date.toLocaleString();
}

function navigateToRegistration() {
  router.push({
    name: 'camp',
    params: {
      camp: props.camp.id
    }
  });
}
</script>

<style scoped></style>

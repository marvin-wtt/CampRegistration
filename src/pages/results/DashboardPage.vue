<template>
  <q-page padding>
    <div class="q-pa-md fit column items-start">
      <!-- Header --->
      <q-card class="col full-width q-ma-md">
        <q-card-section>
          <a class="text-h4"> DFJW Ballonjugendcamp </a>
        </q-card-section>
        <q-card-section> Date: 29.07.2023 - 05.08.2023</q-card-section>
      </q-card>

      <!-- Main body -->
      <div class="reverse row fit wrap">
        <!-- Sidebar -->
        <div class="col-12 col-lg-3 col-xl-3">
          <div class="row">
            <!-- Participants by country -->
            <q-card class="text-center col-lg-12">
              <q-card-section>
                <participants-by-country-chart
                  :countries="countries"
                  :participants="participants"
                  height="200px"
                />
              </q-card-section>
            </q-card>

            <!-- Participants by country -->
            <q-card class="text-center col-lg-12">
              <q-card-section>
                <participants-by-country-chart
                  :countries="countries"
                  :participants="participants"
                  height="200px"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Content -->
        <div class="col-12 col-lg-9 col-xl-9 self-start">
          <div class="column">
            <!-- -->
            <q-card>
              <q-card-section> Emails:</q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!--      <q-card class='col-12 col-lg-8'>-->
      <!--        <q-card-section>-->
      <!--          Tasks:-->
      <!--        </q-card-section>-->
      <!--        <q-table>-->

      <!--        </q-table>-->
      <!--      </q-card>-->

      TODO Statistics
      <q-card class="text-center">
        <q-card-section>
          <participants-by-age-and-country
            :age-max="maxAge"
            :age-min="minAge"
            :countries="countries"
            :participants="participants"
            width="500px"
          />
        </q-card-section>
      </q-card>

      <!--      <q-card class='text-center'>-->
      <!--        <q-card-section>-->

      <!--        </q-card-section>-->
      <!--      </q-card>-->

      <!--      <q-card class='text-center'>-->
      <!--        <q-card-section>-->

      <!--        </q-card-section>-->
      <!--      </q-card>-->
    </div>
  </q-page>
</template>

<script lang="ts" setup>
// FIXME TEMPORARY, REMOVE
import registrations from 'src/lib/example/registrations.json';
import { DataProviderRegistry } from 'src/lib/registration/DataProviderRegistry';
// -----------------------------------------------------------------------------
import { ref } from 'vue';

import ParticipantsByCountryChart from 'components/results/charts/ParticipantsByCountryChart.vue';
import ParticipantsByAgeAndCountry from 'components/results/charts/ParticipantsByAgeAndCountry.vue';

DataProviderRegistry.INSTANCE.register({
  title: 'Age',
  name: 'age',
  isFit(data: unknown): boolean {
    if (!hasAgeRows(data)) return false;

    const date = data.date_of_birth;

    return new Date(date).toString() !== 'Invalid Date';
  },
  generate(data: unknown): string | number {
    if (!hasAgeRows(data)) return '';
    return calculateAge(data.date_of_birth);
  },
});

function calculateAge(date: string): number {
  const months = new Date('2023-07-29').getTime() - new Date(date).getTime();
  const years = new Date(months);

  return Math.abs(years.getUTCFullYear() - 1970);
}

function hasAgeRows(data: unknown): data is { date_of_birth: string } {
  if (data === null) return false;
  if (typeof data !== 'object') return false;

  return 'date_of_birth' in data && typeof data.date_of_birth === 'string';
}

function createResultData(registrations: unknown): ResultData[] {
  if (!isResultData(registrations)) {
    return [];
  }

  registrations.forEach((registration) => {
    DataProviderRegistry.INSTANCE.providers.forEach((provider) => {
      if (!provider.isFit(registration)) {
        return;
      }

      registration[provider.name] = provider.generate(registration);
    });
  });

  return registrations;
}

function isResultData(data: unknown): data is ResultData[] {
  // TODO
  return true;
}

type ResultData = Record<string, unknown>;

// Participants by country
const participants = ref(createResultData(registrations));
const maxParticipants = ref(30);
const countries = ref(['de', 'fr']);

// Participants by country
const minAge = ref<number>(13);
const maxAge = ref<number>(18);

// Others
</script>

<template>
  <q-card
    v-ripple
    class="camp-card"
  >
    <!-- Image -->
    <q-card-section class="col q-pa-none">
      <q-skeleton height="200px" />
    </q-card-section>

    <!-- Content -->
    <div class="col">
      <q-card-section class="column items-start">
        <div class="col text-caption">
          <q-skeleton
            type="text"
            width="150px"
          />
        </div>
        <div class="col text-h5">
          <q-skeleton
            type="text"
            width="200px"
          />
        </div>
      </q-card-section>
      <q-card-section class="column q-pt-none">
        <div class="row">
          <q-icon
            name="place"
            size="sm"
          />
          <q-skeleton
            type="text"
            width="50px"
          />
        </div>
        <div class="row">
          <q-icon
            name="attach_money"
            size="sm"
          />
          <q-skeleton
            type="text"
            width="20px"
          />
        </div>
        <div class="row">
          <q-icon
            name="person"
            size="sm"
          />
          <q-skeleton
            type="text"
            width="50px"
          />
        </div>
        <div class="col q-col-gutter-sm row">
          <q-icon
            name="flag"
            size="sm"
          />
          <q-skeleton
            type="text"
            width="50px"
          />
        </div>
      </q-card-section>
    </div>
  </q-card>
</template>

<script lang="ts" setup></script>

<style scoped>
.camp-card {
  width: 100%;
  max-width: 300px;
}
</style>

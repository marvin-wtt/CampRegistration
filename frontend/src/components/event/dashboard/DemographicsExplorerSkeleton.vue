<template>
  <q-card
    flat
    bordered
  >
    <q-card-section class="row items-center no-wrap q-gutter-x-md">
      <q-skeleton
        type="QAvatar"
        size="40px"
      />
      <div class="col">
        <q-skeleton
          type="text"
          width="40%"
        />
        <q-skeleton
          type="text"
          width="60%"
        />
      </div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-skeleton
        type="rect"
        height="340px"
      />
    </q-card-section>
  </q-card>
</template>

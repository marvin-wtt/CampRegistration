<template>
  <!-- Mirrors the newsletter card of NewsletterIndexPage: name, organization
       caption, description and the menu button. -->
  <q-card
    flat
    bordered
    class="full-height"
  >
    <q-card-section class="q-pa-md">
      <div class="row items-start no-wrap">
        <div class="col">
          <q-skeleton
            type="text"
            width="65%"
            class="text-subtitle1"
          />
          <q-skeleton
            type="text"
            width="45%"
            class="text-caption"
          />
          <q-skeleton
            type="text"
            class="text-body2 q-mt-xs"
          />
          <q-skeleton
            type="text"
            width="80%"
            class="text-body2"
          />
        </div>
        <q-skeleton
          type="circle"
          size="28px"
          class="q-ml-xs"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

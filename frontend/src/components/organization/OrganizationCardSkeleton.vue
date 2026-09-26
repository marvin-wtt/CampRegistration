<template>
  <!-- Mirrors the organization card of OrganizationIndexPage: name, country
       and verification-status chip. -->
  <q-card
    flat
    bordered
    class="full-height rounded-lg"
  >
    <q-card-section class="q-pa-md">
      <q-skeleton
        type="text"
        width="70%"
        class="text-subtitle1"
      />
      <q-skeleton
        type="text"
        width="40%"
        class="text-body2 q-mt-xs"
      />
      <q-skeleton
        type="QChip"
        width="96px"
        height="24px"
        class="status-chip-skeleton q-mt-sm"
      />
    </q-card-section>
  </q-card>
</template>

<style scoped>
.status-chip-skeleton {
  border-radius: 4px;
}
</style>

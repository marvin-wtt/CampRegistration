<template>
  <q-card class="mgmt-card-skeleton">
    <!-- Header -->
    <div class="mgmt-card-skeleton__head">
      <q-skeleton
        type="rect"
        width="44px"
        height="44px"
        class="mgmt-card-skeleton__avatar"
      />
      <div class="mgmt-card-skeleton__heading">
        <q-skeleton
          type="text"
          width="75%"
          height="20px"
        />
        <q-skeleton
          type="text"
          width="55%"
          height="14px"
        />
      </div>
    </div>

    <!-- Capacity -->
    <div class="mgmt-card-skeleton__capacity">
      <q-skeleton
        type="text"
        width="40%"
        height="12px"
      />
      <q-skeleton
        type="rect"
        height="6px"
      />
    </div>

    <!-- Nav -->
    <div class="mgmt-card-skeleton__nav">
      <q-skeleton
        type="QBtn"
        height="32px"
        class="col"
      />
      <q-skeleton
        type="QBtn"
        height="32px"
        class="col"
      />
    </div>
  </q-card>
</template>

<script lang="ts" setup></script>

<style scoped>
.mgmt-card-skeleton {
  display: flex;
  flex-direction: column;
  gap: 14px;

  min-width: 0;
  padding: 16px;
  border-radius: 16px;

  background: var(--md3-surface-container-low);
  box-shadow: none;
}

.mgmt-card-skeleton__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.mgmt-card-skeleton__avatar {
  flex-shrink: 0;
  border-radius: 12px;
}

.mgmt-card-skeleton__heading {
  flex: 1;
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mgmt-card-skeleton__capacity {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mgmt-card-skeleton__capacity .q-skeleton--type-rect {
  border-radius: 3px;
}

.mgmt-card-skeleton__nav {
  display: flex;
  gap: 8px;

  padding-top: 14px;
  border-top: 1px solid var(--md3-outline-variant);
}
</style>

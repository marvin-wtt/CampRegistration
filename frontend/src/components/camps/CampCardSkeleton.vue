<template>
  <q-card class="camp-card-skeleton">
    <!-- Banner -->
    <q-skeleton
      square
      height="120px"
    />

    <!-- Content -->
    <q-card-section class="camp-card-skeleton__body">
      <q-skeleton
        type="text"
        width="45%"
        height="14px"
      />
      <q-skeleton
        type="text"
        width="80%"
        height="26px"
      />
      <q-skeleton
        type="text"
        width="55%"
        height="16px"
      />

      <div class="camp-card-skeleton__meta">
        <q-skeleton
          type="text"
          width="65%"
          height="16px"
        />
        <q-skeleton
          type="text"
          width="40%"
          height="16px"
        />
      </div>

      <div class="camp-card-skeleton__footer">
        <q-skeleton
          type="text"
          width="56px"
          height="22px"
        />
        <q-skeleton
          type="circle"
          size="20px"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup></script>

<style scoped>
.camp-card-skeleton {
  min-width: 0;
  border-radius: 16px;
  overflow: hidden;

  background: var(--md3-surface-container-low);
  box-shadow: none;
}

.camp-card-skeleton__body {
  padding: 16px;
}

.camp-card-skeleton__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 14px;
}

.camp-card-skeleton__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--md3-outline-variant);
}
</style>

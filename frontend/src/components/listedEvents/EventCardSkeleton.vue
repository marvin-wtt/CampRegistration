<template>
  <q-card class="event-card-skeleton">
    <!-- Banner -->
    <q-skeleton
      square
      height="120px"
    />

    <!-- Content -->
    <q-card-section class="event-card-skeleton__body">
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

      <div class="event-card-skeleton__meta">
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

      <div class="event-card-skeleton__capacity">
        <q-skeleton
          type="text"
          width="35%"
          height="12px"
        />
        <q-skeleton
          type="rect"
          height="6px"
        />
      </div>

      <div class="event-card-skeleton__footer">
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
.event-card-skeleton {
  min-width: 0;
  border-radius: var(--md3-corner-extra-large, 28px);
  overflow: hidden;

  background: var(--md3-surface-container);
  box-shadow: none;
}

.event-card-skeleton__body {
  padding: 16px;
}

.event-card-skeleton__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 14px;
}

.event-card-skeleton__capacity {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 14px;
}

.event-card-skeleton__capacity .q-skeleton--type-rect {
  border-radius: 3px;
}

.event-card-skeleton__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--md3-outline-variant);
}
</style>

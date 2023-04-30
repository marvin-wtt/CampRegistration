<template>
  <q-page class="row items-center justify-evenly">
    <q-btn
      :to="{ name: 'camps' }"
      label="Camps"
      outline
    />
    <q-btn
      :to="{ name: 'campManagement' }"
      label="Camp Management"
      outline
    />
  </q-page>
</template>

<script lang="ts" setup></script>

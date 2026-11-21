<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailButton from './components/EmailButton.vue';
import EmailHeading from './components/EmailHeading.vue';
import EmailNote from './components/EmailNote.vue';
import EmailParagraph from './components/EmailParagraph.vue';
import type { OrganizationRejectedProps } from './types';

defineProps<OrganizationRejectedProps>();
</script>

<template>
  <email-layout
    :subject="subject"
    :preview="preview"
    :app-name="appName"
    :primary-color="primaryColor"
    :sent-to="sentTo"
    :reason="reason"
  >
    <email-heading align="center">{{ title }}</email-heading>
    <email-paragraph align="center">{{ information }}</email-paragraph>
    <email-note
      v-if="reviewNote"
      :primary-color="primaryColor"
      :primary-tint="primaryTint"
      :label="reasonLabel"
      padding="0 40px 28px"
    >
      {{ reviewNote }}
    </email-note>
    <email-button
      :primary-color="primaryColor"
      :href="url"
    >
      {{ button }}
    </email-button>
  </email-layout>
</template>

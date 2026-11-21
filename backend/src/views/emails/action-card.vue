<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailButton from './components/EmailButton.vue';
import EmailHeading from './components/EmailHeading.vue';
import EmailNote from './components/EmailNote.vue';
import EmailParagraph from './components/EmailParagraph.vue';
import type { ActionCardProps } from './types';

defineProps<ActionCardProps>();
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
    <email-button
      :primary-color="primaryColor"
      :href="url"
    >
      {{ button }}
    </email-button>
    <email-note
      v-if="accidental"
      :primary-color="primaryColor"
      :primary-tint="primaryTint"
    >
      {{ accidental }}
    </email-note>
  </email-layout>
</template>

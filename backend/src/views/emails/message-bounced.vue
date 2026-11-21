<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailButton from './components/EmailButton.vue';
import EmailHeading from './components/EmailHeading.vue';
import EmailParagraph from './components/EmailParagraph.vue';
import type { MessageBouncedProps } from './types';

defineProps<MessageBouncedProps>();
</script>

<template>
  <email-layout
    :subject="subject"
    :preview="preview"
    :app-name="appName"
    :primary-color="primaryColor"
    :sent-to="sentTo"
    :reason="reason"
    :subtitle="eventName"
  >
    <email-heading align="center">{{ title }}</email-heading>
    <email-paragraph align="center">{{ information }}</email-paragraph>
    <email-button
      :primary-color="primaryColor"
      :href="url"
      css-class="confirm-email-link"
    >
      {{ button }}
    </email-button>
  </email-layout>
</template>

<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailRichText from './components/EmailRichText.vue';
import type { DefaultEmailProps } from './types';

defineProps<DefaultEmailProps>();
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
    <email-rich-text :html="body" />
  </email-layout>
</template>

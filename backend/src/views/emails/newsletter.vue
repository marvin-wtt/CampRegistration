<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailRichText from './components/EmailRichText.vue';
import type { NewsletterProps } from './types';

defineProps<NewsletterProps>();
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
    <template #footer>
      &#32;<a
        :href="unsubscribeUrl"
        style="color: #64748b"
        >{{ unsubscribeLabel }}</a
      >
    </template>
  </email-layout>
</template>

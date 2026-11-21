<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailRichText from './components/EmailRichText.vue';
import type { RegistrationMessageProps } from './types';

defineProps<RegistrationMessageProps>();
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
    <email-rich-text :html="body" />
    <template
      v-if="privacyUrl"
      #footer
    >
      <br />
      <a
        :href="privacyUrl"
        style="color: #64748b"
        >{{ privacyLabel }}</a
      >
    </template>
  </email-layout>
</template>

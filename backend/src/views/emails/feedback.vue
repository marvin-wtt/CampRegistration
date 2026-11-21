<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailHeading from './components/EmailHeading.vue';
import EmailParagraph from './components/EmailParagraph.vue';
import type { FeedbackProps } from './types';

defineProps<FeedbackProps>();

const labelStyle =
  'margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase;';
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
    <email-heading>{{ title }}</email-heading>
    <email-paragraph
      padding="0 40px 20px"
      muted
    >
      {{ replyNote }}
    </email-paragraph>
    <mj-divider
      border-color="#e2e8f0"
      border-width="1px"
      padding="0 40px 20px"
    />
    <email-paragraph
      v-if="sender"
      padding="0 40px 20px"
    >
      <p :style="labelStyle">{{ senderLabel }}</p>
      {{ sender }}
    </email-paragraph>
    <email-paragraph padding="0 40px">
      <p :style="labelStyle">{{ messageLabel }}</p>
      {{ message }}
    </email-paragraph>
  </email-layout>
</template>

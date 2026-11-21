<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailButton from './components/EmailButton.vue';
import EmailHeading from './components/EmailHeading.vue';
import EmailNote from './components/EmailNote.vue';
import EmailParagraph from './components/EmailParagraph.vue';
import type { EventRetentionDueProps } from './types';

defineProps<EventRetentionDueProps>();
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
    <email-paragraph padding="0 40px 20px">{{ information }}</email-paragraph>
    <email-paragraph padding="0 40px 20px">{{ action }}</email-paragraph>
    <!-- Never let the mail read as "delete everything": the notice these
         managers published keeps some of it deliberately. -->
    <email-paragraph
      v-if="hasExceptions"
      padding="0 40px 20px"
      >{{ exceptions }}</email-paragraph
    >
    <email-paragraph
      v-if="hasConsentBoundData"
      padding="0 40px 20px"
      >{{ consentBound }}</email-paragraph
    >
    <email-note
      :primary-color="primaryColor"
      :primary-tint="primaryTint"
      padding="0 40px 28px"
    >
      {{ noAutomaticDeletion }}
    </email-note>
    <email-button
      :primary-color="primaryColor"
      :href="url"
      align="left"
    >
      {{ button }}
    </email-button>
  </email-layout>
</template>

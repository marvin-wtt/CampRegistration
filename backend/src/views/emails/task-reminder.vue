<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue';
import EmailButton from './components/EmailButton.vue';
import EmailHeading from './components/EmailHeading.vue';
import EmailParagraph from './components/EmailParagraph.vue';
import type { TaskReminderProps } from './types';

defineProps<TaskReminderProps>();
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
    <mj-text
      v-for="group in groups"
      :key="group.url"
      padding="0 40px 20px"
    >
      <div
        style="
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          text-align: left;
        "
      >
        <div
          style="
            margin-bottom: 4px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #64748b;
          "
        >
          {{ group.eventName }}
        </div>
        <div
          v-for="(task, index) in group.tasks"
          :key="index"
          :style="`padding: 10px 0; ${index > 0 ? 'border-top: 1px solid #e2e8f0;' : ''}`"
        >
          <div style="font-size: 15px; font-weight: 600; color: #0f172a">
            {{ task.title }}
          </div>
          <div style="font-size: 14px; color: #64748b">{{ task.when }}</div>
        </div>
        <!-- With several events, each links to its own tasks. -->
        <a
          v-if="groups.length > 1"
          :href="group.url"
          :style="`display: inline-block; margin-top: 6px; font-size: 14px; font-weight: 600; color: ${primaryColor}; text-decoration: none;`"
          >{{ groupLinkLabel }} →</a
        >
      </div>
    </mj-text>
    <email-button
      v-if="groups.length <= 1"
      :primary-color="primaryColor"
      :href="url"
    >
      {{ button }}
    </email-button>
  </email-layout>
</template>

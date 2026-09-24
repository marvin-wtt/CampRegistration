<script setup lang="ts">
import EmailHead from './components/EmailHead.vue';
import EmailHeader from './components/EmailHeader.vue';
import EmailFooter from './components/EmailFooter.vue';
import EmailButton from './components/EmailButton.vue';
import EmailHeading from './components/EmailHeading.vue';
import EmailParagraph from './components/EmailParagraph.vue';
import type { VerifyEmailProps } from './types';

defineProps<VerifyEmailProps>();
</script>

<template>
  <mjml>
    <email-head
      :subject="subject"
      :preview="preview"
    />
    <mj-body
      background-color="#f3f4f6"
      css-class="email-body"
    >
      <email-header
        :primary-color="primaryColor"
        :app-name="appName"
      />
      <mj-section
        background-color="#ffffff"
        padding="36px 0 44px"
      >
        <mj-column>
          <email-heading>{{ title }}</email-heading>
          <email-paragraph>{{ information }}</email-paragraph>
          <email-button
            :primary-color="primaryColor"
            :href="url"
            css-class="confirm-email-link"
          >
            {{ button }}
          </email-button>
          <mj-text
            font-size="14px"
            line-height="1.6"
            color="#6b7280"
            padding="20px 36px 0"
          >
            {{ accidental }}
          </mj-text>
          <email-paragraph padding="16px 36px 0">
            {{ greeting }}<br />
            {{ teamName }}
          </email-paragraph>
        </mj-column>
      </mj-section>
      <email-footer
        :sent-to="sentTo"
        :reason="reason"
      />
    </mj-body>
  </mjml>
</template>

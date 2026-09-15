<script setup lang="ts">
import EmailHead from './components/EmailHead.vue';
import EmailHeader from './components/EmailHeader.vue';
import EmailFooter from './components/EmailFooter.vue';
import EmailButton from './components/EmailButton.vue';
import EmailHeading from './components/EmailHeading.vue';
import EmailParagraph from './components/EmailParagraph.vue';
import type { OrganizationRejectedProps } from './types';

defineProps<OrganizationRejectedProps>();
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
          <template v-if="reviewNote">
            <mj-text
              font-size="13px"
              font-weight="600"
              color="#6b7280"
              padding="0 36px 6px"
              text-transform="uppercase"
              letter-spacing="0.05em"
            >
              {{ reasonLabel }}
            </mj-text>
            <mj-text
              font-size="15px"
              line-height="1.7"
              color="#374151"
              padding="0 36px 28px"
              container-background-color="#f9fafb"
            >
              {{ reviewNote }}
            </mj-text>
          </template>
          <email-button
            :primary-color="primaryColor"
            :href="url"
          >
            {{ button }}
          </email-button>
          <email-paragraph padding="28px 36px 0">
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

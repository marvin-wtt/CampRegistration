<script setup lang="ts">
import EmailHead from './EmailHead.vue';
import EmailHeader from './EmailHeader.vue';
import EmailFooter from './EmailFooter.vue';

interface Props {
  subject: string;
  preview: string;
  appName: string;
  primaryColor: string;
  sentTo: string;
  reason?: string;
  subtitle?: string;
}

defineProps<Props>();
</script>

<template>
  <mjml>
    <email-head
      :subject="subject"
      :preview="preview"
    />
    <mj-body
      background-color="#eef2f6"
      css-class="email-body"
    >
      <mj-wrapper padding="32px 12px">
        <email-header
          :primary-color="primaryColor"
          :app-name="appName"
          :subtitle="subtitle"
        />
        <mj-section
          background-color="#ffffff"
          padding="40px 0 32px"
        >
          <mj-column>
            <slot />
          </mj-column>
        </mj-section>
        <email-footer
          :sent-to="sentTo"
          :reason="reason"
        >
          <template #extra>
            <slot name="footer" />
          </template>
        </email-footer>
      </mj-wrapper>
    </mj-body>
  </mjml>
</template>

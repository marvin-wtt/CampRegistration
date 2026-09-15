<script setup lang="ts">
import EmailHead from './components/EmailHead.vue';
import EmailHeader from './components/EmailHeader.vue';
import EmailFooter from './components/EmailFooter.vue';
import type { RegistrationMessageProps } from './types';

defineProps<RegistrationMessageProps>();
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
        :subtitle="eventName"
      />
      <mj-section
        background-color="#ffffff"
        padding="36px 0 44px"
      >
        <mj-column>
          <mj-text
            font-size="15px"
            line-height="1.8"
            color="#1f2937"
            padding="0 36px"
            css-class="body-text"
          >
            <div v-html="body" />
          </mj-text>
        </mj-column>
      </mj-section>
      <email-footer
        :sent-to="sentTo"
        :reason="reason"
      >
        <template
          v-if="privacyUrl"
          #extra
        >
          <br />
          <a
            :href="privacyUrl"
            style="color: #6b7280"
            >{{ privacyLabel }}</a
          >
        </template>
      </email-footer>
    </mj-body>
  </mjml>
</template>

<script setup lang="ts">
import EmailHead from './components/EmailHead.vue';
import EmailHeader from './components/EmailHeader.vue';
import EmailFooter from './components/EmailFooter.vue';
import type { FeedbackProps } from './types';

defineProps<FeedbackProps>();
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
          <mj-text
            font-size="22px"
            font-weight="700"
            color="#111827"
            padding="0 36px 16px"
          >
            {{ title }}
          </mj-text>
          <mj-text
            font-size="14px"
            line-height="1.6"
            color="#6b7280"
            padding="0 36px 20px"
          >
            {{ replyNote }}
          </mj-text>
          <mj-divider
            border-color="#e5e7eb"
            border-width="1px"
            padding="0 36px 20px"
          />
          <mj-text
            font-size="15px"
            line-height="1.7"
            color="#1f2937"
            padding="0 36px 0"
          >
            <p
              style="
                margin: 0 0 4px;
                font-size: 11px;
                font-weight: 600;
                color: #9ca3af;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              "
            >
              {{ messageLabel }}
            </p>
            {{ message }}
          </mj-text>
          <mj-text
            v-if="location || userAgent"
            font-size="15px"
            line-height="1.7"
            color="#1f2937"
            padding="20px 36px 0"
          >
            <template v-if="location">
              <p
                style="
                  margin: 0 0 4px;
                  font-size: 11px;
                  font-weight: 600;
                  color: #9ca3af;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                "
              >
                {{ locationLabel }}
              </p>
              {{ location }}
            </template>
            <template v-if="userAgent">
              <p
                :style="{
                  margin: `${location ? '16px' : '0'} 0 4px`,
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#9ca3af',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }"
              >
                {{ userAgentLabel }}
              </p>
              <span style="font-size: 13px; color: #6b7280">{{
                userAgent
              }}</span>
            </template>
          </mj-text>
        </mj-column>
      </mj-section>
      <email-footer
        :sent-to="sentTo"
        :reason="reason"
      />
    </mj-body>
  </mjml>
</template>

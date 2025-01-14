<template>
  <q-page
    class="row justify-center"
    :class="quasar.screen.gt.xs ? 'content-center' : ''"
  >
    <q-card
      class="q-pa-md col-xs-12 col-sm-8 col-md-5 col-lg-3"
      :flat="quasar.screen.lt.sm"
    >
      <q-form
        class="fit column justify-center no-wrap"
        @submit="verify"
      >
        <q-card-section class="text-h4 text-bold text-center">
          {{ t('title') }}
        </q-card-section>

        <!-- Description -->
        <q-card-section>
          <p class="text-subtitle1 text-center">
            {{ t('description') }}
          </p>
        </q-card-section>

        <q-card-section class="row justify-center">
          <q-avatar
            icon="verified_user"
            color="primary"
            text-color="white"
            size="100px"
          />
        </q-card-section>

        <q-card-section>
          <otp-input
            v-model="otp"
            :length="6"
            :disable="loading"
            outline
          />
        </q-card-section>

        <q-card-actions class="q-ma-md">
          <q-btn
            :label="t('actions.verify')"
            type="submit"
            :loading
            color="primary"
            size="lg"
            class="full-width"
            rounded
          />
        </q-card-actions>

        <q-card-section
          v-if="error"
          class="text-negative text-center text-bold"
        >
          {{ error }}
        </q-card-section>
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import OtpInput from 'components/auth/OtpInput.vue';
import { useQuasar } from 'quasar';

const quasar = useQuasar();
const { t } = useI18n();

const authStore = useAuthStore();
const { loading, error } = storeToRefs(authStore);

const otp = ref<string>('');

authStore.reset();

function verify() {
  authStore.verifyOtp(otp.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'OTP Verifciation'

description: 'To proceed, open your authenticator app and enter the 6-digit code displayed.'

actions:
  verify: 'Verify'
</i18n>

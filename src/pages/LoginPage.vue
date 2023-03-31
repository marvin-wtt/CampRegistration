<template>
  <q-page
    padding
    class="fit column justify-center content-center"
  >
    <!-- content -->
    <q-card class="q-pa-md">
      <q-card-section>
        <a class="text-h4"> Login </a>
      </q-card-section>
      <q-form>
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            autocomplete="email"
            :label="t('email')"
            outlined
            rounded
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            type="password"
            autocomplete="password"
            :label="t('password')"
            outlined
            rounded
          >
            <template v-slot:prepend>
              <q-icon name="key" />
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions>
          <q-btn
            :loading="loading"
            color="primary"
            size="lg"
            class="full-width"
            :label="t('login')"
            rounded
          />
        </q-card-actions>

        <q-card-section class="text-center">
          <a class="text-grey-6">
            <router-link to="/register">
              {{ t('forgot_password') }}
            </router-link>
          </a>
        </q-card-section>

        <q-separator />

        <q-card-section class="text-center">
          <q-btn
            color="primary"
            size="lg"
            class="full-width"
            :label="t('create_new')"
            rounded
            outline
          />
        </q-card-section>
      </q-form>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const email = ref<string>('');
const password = ref<string>('');
const loading = ref<boolean>(false);
</script>

<i18n lang="yaml" locale="en">
email: 'Email'
password: 'Password'
login: 'Login'
create_new: 'Create New'
forgot_password: 'Forgot password ?'
</i18n>

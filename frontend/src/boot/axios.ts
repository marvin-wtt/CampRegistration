import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { markRaw } from 'vue';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

export default defineBoot(({ app, ssrContext }) => {
  const origin =
    process.env.SERVER && ssrContext
      ? `${ssrContext.req.protocol}://${ssrContext.req.get('host')}`
      : window.location.origin;

  const api = axios.create({
    baseURL: `${origin}/api/v1/`,
    // Needed for auth
    withCredentials: true,
  });

  app.config.globalProperties.$api = api;

  app.provide('api', markRaw(api));
});

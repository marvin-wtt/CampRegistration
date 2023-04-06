import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { messages } from 'stores/camp/camp-registration-translations';

import registrations from 'src/lib/example/registrations.json';
import { useAPIService } from 'src/services/APIService';
import { Registration } from 'src/types/Registration';

export const useCampRegistrationsStore = defineStore(
  'campRegistrations',
  () => {
    const route = useRoute();
    const router = useRouter();
    const quasar = useQuasar();
    const { t } = useI18n({ messages: messages });
    const apiService = useAPIService();

    const data = ref<Registration[]>();
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    // TODO Should this even happen here?
    router.beforeEach((to, from) => {
      if (to.params.camp === undefined) {
        return;
      }

      // TODO Only fetch for result routes - not camp.
      if (data.value === undefined || to.params.camp !== from.params.camp) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ignored = fetchData(to.params.camp as string);
        return;
      }
    });

    async function loadSampleData() {
      data.value = registrations.map((registration: Registration) => {
        if (
          'legal_guardian_permission_leave' in registration &&
          typeof registration.legal_guardian_permission_leave === 'string'
        ) {
          registration.legal_guardian_permission_leave = Number(
            registration.legal_guardian_permission_leave
          );
        }

        if (
          'agreement_privacy' in registration &&
          typeof registration.agreement_privacy !== 'boolean'
        ) {
          registration.agreement_privacy =
            Array.isArray(registration.agreement_privacy) &&
            registration.agreement_privacy.length === 1 &&
            registration.agreement_privacy[0] === '1';
        }

        if (
          'agreement_rules' in registration &&
          typeof registration.agreement_rules !== 'boolean'
        ) {
          registration.agreement_rules =
            Array.isArray(registration.agreement_rules) &&
            registration.agreement_rules.length === 1 &&
            registration.agreement_rules[0] === '1';
        }

        if (
          'agreement_forward_list_participants' in registration &&
          typeof registration.agreement_forward_list_participants !== 'boolean'
        ) {
          registration.agreement_forward_list_participants =
            Array.isArray(registration.agreement_forward_list_participants) &&
            registration.agreement_forward_list_participants.length === 1 &&
            registration.agreement_forward_list_participants[0] === '1';
        }

        if (
          'agreement_general_terms_and_conditions' in registration &&
          typeof registration.agreement_general_terms_and_conditions !==
            'boolean'
        ) {
          registration.agreement_general_terms_and_conditions =
            Array.isArray(
              registration.agreement_general_terms_and_conditions
            ) &&
            registration.agreement_general_terms_and_conditions.length === 1 &&
            registration.agreement_general_terms_and_conditions[0] === '1';
        }

        if (
          'language_skills' in registration &&
          typeof registration.language_skills === 'object' &&
          registration.language_skills !== null
        ) {
          if (
            'de' in registration.language_skills &&
            typeof registration.language_skills.de === 'object'
          ) {
            const level =
              registration.language_skills.de !== null &&
              'Column 1' in registration.language_skills.de
                ? Number(registration.language_skills.de['Column 1'])
                : 0;
            registration.language_skills.de = (level / 3) * 100;
          }
          if (
            'en' in registration.language_skills &&
            typeof registration.language_skills.en === 'object'
          ) {
            const level =
              registration.language_skills.en !== null &&
              'Column 1' in registration.language_skills.en
                ? Number(registration.language_skills.en['Column 1'])
                : 0;
            registration.language_skills.en = (level / 3) * 100;
          }
          if (
            'fr' in registration.language_skills &&
            typeof registration.language_skills.fr === 'object'
          ) {
            const level =
              registration.language_skills.fr !== null &&
              'Column 1' in registration.language_skills.fr
                ? Number(registration.language_skills.fr['Column 1'])
                : 0;
            registration.language_skills.fr = (level / 3) * 100;
          }
        }

        return registration;
      });
    }

    async function fetchData(id?: string) {
      isLoading.value = true;
      error.value = null;

      const campId = id ?? (route.params.camp as string);
      if (campId === undefined) {
        error.value = '404';
        isLoading.value = false;
        return;
      }

      try {
        data.value = await apiService.fetchRegistrations(campId);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'error';

        quasar.notify({
          type: 'negative',
          message: t('fetch.error'),
          position: 'top',
        });
      } finally {
        isLoading.value = false;
      }
    }

    // TODO on logout
    function clearData() {
      data.value = undefined;
      isLoading.value = false;
      error.value = null;
    }

    async function updateData(
      registrationId: string | undefined,
      data: Partial<Registration>
    ) {
      const campId = route.params.camp as string;

      if (campId === undefined || registrationId === undefined) {
        quasar.notify({
          type: 'negative',
          message: t('update.invalid'),
          position: 'top',
        });
        return;
      }

      try {
        await apiService.updateRegistration(campId, registrationId, data);

        quasar.notify({
          type: 'positive',
          message: t('update.success'),
          position: 'top',
        });
      } catch (e: unknown) {
        quasar.notify({
          type: 'negative',
          message: t('update.error'),
          position: 'top',
        });
      } finally {
        // Fetch data again because it updated
        await fetchData();
      }
    }

    async function deleteData(registrationId: string | undefined) {
      const campId = route.params.camp as string;

      if (campId === undefined || registrationId === undefined) {
        quasar.notify({
          type: 'negative',
          message: t('delete.invalid'),
          position: 'top',
        });
        return;
      }

      try {
        await apiService.deleteRegistration(campId, registrationId);

        quasar.notify({
          type: 'positive',
          message: t('delete.success'),
          position: 'top',
        });
      } catch (e: unknown) {
        quasar.notify({
          type: 'negative',
          message: t('delete.error'),
          position: 'top',
        });
      } finally {
        await fetchData();
      }
    }

    return {
      data,
      isLoading,
      error,
      fetchData,
      updateData,
      deleteData,
    };
  }
);

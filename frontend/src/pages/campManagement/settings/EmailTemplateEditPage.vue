<template>
  <page-state-handler
    :error
    class="row justify-center"
    padding
  >
    <div class="column col-sm-12 col-md-9 col-lg-8 col-xl-6">
      <div class="q-pa-sm">
        <p class="text-h4 text-bold">
          {{ t('page.title') }}
        </p>
        <p class="text-subtitle2">
          {{ t('page.description') }}
        </p>
      </div>

      <q-list v-if="loading">
        <q-item
          v-for="i in 6"
          :key="i"
        >
          <q-item-section avatar>
            <q-skeleton
              type="circle"
              size="30px"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton
                type="text"
                width="200px"
              />
            </q-item-label>
            <q-item-label caption>
              <q-skeleton
                type="text"
                width="500px"
              />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-skeleton
              type="circle"
              size="30px"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <q-list v-else>
        <q-item
          v-for="{ id, event: name, loading } in templates"
          :key="name"
          :clickable="!!id && !loading"
          :aria-label="!!id ? t('action.edit') : undefined"
          @click="editTemplate(id)"
        >
          <q-item-section avatar>
            <q-icon
              :name="TEMPLATE_ICONS[name] ?? 'mail_outline'"
              color="primary"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>
              {{ t(`template.${name ?? 'default'}.label`) }}
            </q-item-label>
            <q-item-label caption>
              {{ t(`template.${name ?? 'default'}.description`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn
              v-if="id"
              icon="more_vert"
              round
              dense
              unelevated
              :loading
              :disable="loading"
              @click.stop
            >
              <q-menu>
                <q-list style="min-width: 200px">
                  <q-item
                    clickable
                    v-close-popup
                    @click="editTemplate(id)"
                  >
                    <q-item-section avatar>
                      <q-icon name="edit" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        {{ t('action.edit') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click="deleteTemplate(id)"
                  >
                    <q-item-section avatar>
                      <q-icon
                        name="delete"
                        color="negative"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-negative">
                        {{ t('action.delete') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>

            <q-btn
              v-else
              :aria-label="t('action.add')"
              icon="add"
              color="primary"
              round
              dense
              unelevated
              @click="addTemplate(name)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </page-state-handler>
</template>

<script setup lang="ts">
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import MessageEditDialog from 'components/campManagement/settings/emails/MessageEditDialog.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import type { MessageTemplate } from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';

const {
  queryParam,
  data,
  withResultNotification,
  forceFetch,
  isLoading,
  error,
} = useServiceHandler<MessageTemplate[]>('message_templates');

const api = useAPIService();
const quasar = useQuasar();
const { t } = useI18n();
const campDetailsStore = useCampDetailsStore();

onBeforeMount(() => {
  campDetailsStore.fetchData();
  loadData();
});

const TEMPLATE_ICONS: Record<string, string> = {
  registration_submitted: 'o_assignment_turned_in',
  registration_confirmed: 'check_circle',
  registration_waitlisted: 'hourglass_empty',
  registration_waitlist_accepted: 'verified_user',
  registration_updated: 'edit',
  registration_canceled: 'cancel',
};

interface CMessageTemplate {
  id: string | null;
  event: string;
  loading: boolean;
}

const loading = computed<boolean>(() => {
  return isLoading.value;
});

function loadData() {
  forceFetch(async () => {
    return api.fetchMessageTemplates(queryParam('camp'));
  });
}

const templates = computed<CMessageTemplate[]>(() => {
  if (!data.value) {
    return [];
  }

  return data.value
    .filter(templateHasEvent)
    .map((template): CMessageTemplate => {
      return {
        ...template,
        loading: false,
      };
    });
  //
});

function templateHasEvent(
  template: MessageTemplate,
): template is MessageTemplate & { event: string } {
  return template.event !== null;
}

function withProgress(fn: () => Promise<MessageTemplate>) {}

function addTemplate(event: string) {
  // TODO Fetch default text from server

  const camp = campDetailsStore.data;
  if (!camp) return;

  const template = data.value?.find((template) => template.event === event);
  if (!template) {
    console.log(event, template, data.value);
    return;
  }

  quasar
    .dialog({
      component: MessageEditDialog,
      componentProps: {
        form: camp.form,
        countries: camp.countries,
        subject: template.subject,
        body: template.body,
      },
    })
    .onOk((message) => {
      console.log(message);
      // TODO
    });
}

function editTemplate(id: string | undefined) {
  if (!id) return;

  const camp = campDetailsStore.data;
  if (!camp) return;

  quasar
    .dialog({
      component: MessageEditDialog,
      componentProps: {
        form: camp.form,
        countries: camp.countries,
        // TODO
        subject: {
          de: '',
          fr: '',
        },
        body: {
          de: '',
          fr: '',
        },
      },
    })
    .onOk((message) => {
      // TODO
    });
}

function deleteTemplate(id: string | undefined) {
  if (!id) return;

  // TODO
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
action:
  add: 'Add template'
  edit: 'Edit template'
  delete: 'Delete template'

page:
  title: 'Registration Events'
  description: 'Manage and edit the email templates for each registration event.'

template:
  registration_submitted:
    label: 'Registration Submitted'
    description: 'Triggered when a user submits a new registration.'
  registration_confirmed:
    label: 'Registration Confirmed'
    description: 'Triggered when a registration is directly confirmed and not on the waitlist.'
  registration_waitlisted:
    label: 'Registration Waitlisted'
    description: 'Triggered when a registration is placed on the waitlist because the limit for this country has been reached.'
  registration_waitlist_accepted:
    label: 'Waitlist Registration Accepted'
    description: 'Triggered when a registration from the waitlist is confirmed.'
  registration_updated:
    label: 'Registration Updated'
    description: 'Triggered when any details of a registration are updated after submission.'
  registration_canceled:
    label: 'Registration Canceled'
    description: 'Triggered when a registration is canceled.'
</i18n>

<i18n lang="yaml" locale="de">
action:
  add: 'Vorlage hinzufügen'
  edit: 'Vorlage bearbeiten'
  delete: 'Vorlage löschen'

page:
  title: 'Anmeldeereignisse'
  description: 'Verwalten und bearbeiten Sie die E-Mail-Vorlagen für jedes Anmeldeereignis.'

template:
  registration_submitted:
    label: 'Anmeldung Eingereicht'
    description: 'Wird ausgelöst, wenn ein Benutzer eine neue Anmeldung einreicht.'
  registration_confirmed:
    label: 'Anmeldung Bestätigt'
    description: 'Wird ausgelöst, wenn eine Anmeldung direkt bestätigt wird und nicht auf der Warteliste steht.'
  registration_waitlisted:
    label: 'Anmeldung auf Warteliste'
    description: 'Wird ausgelöst, wenn eine Anmeldung auf die Warteliste gesetzt wird, weil das Limit für dieses Land erreicht wurde.'
  registration_waitlist_accepted:
    label: 'Wartelistenanmeldung Akzeptiert'
    description: 'Wird ausgelöst, wenn eine Anmeldung von der Warteliste bestätigt wird.'
  registration_updated:
    label: 'Anmeldung Aktualisiert'
    description: 'Wird ausgelöst, wenn nach der Einreichung einer Anmeldung Details aktualisiert werden.'
  registration_canceled:
    label: 'Anmeldung Storniert'
    description: 'Wird ausgelöst, wenn eine Anmeldung storniert wird.'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  add: 'Ajouter un modèle'
  edit: 'Modifier le modèle'
  delete: 'Supprimer le modèle'

page:
  title: "Événements d'Inscription"
  description: "Gérez et modifiez les modèles d'e-mails pour chaque événement d'inscription."

template:
  registration_submitted:
    label: 'Inscription Soumise'
    description: "Déclenché lorsqu'un utilisateur soumet une nouvelle inscription."
  registration_confirmed:
    label: 'Inscription Confirmée'
    description: "Déclenché lorsque l'inscription est confirmée directement et n'est pas en liste d'attente."
  registration_waitlisted:
    label: "Inscription en Liste d'Attente"
    description: "Déclenché lorsqu'une inscription est placée en liste d'attente parce que la limite pour ce pays a été atteinte."
  registration_waitlist_accepted:
    label: "Inscription Acceptée depuis la Liste d'Attente"
    description: "Déclenché lorsqu'une inscription en liste d'attente est confirmée."
  registration_updated:
    label: 'Inscription Mise à Jour'
    description: "Déclenché lorsque des détails d'une inscription sont mis à jour après sa soumission."
  registration_canceled:
    label: 'Inscription Annulée'
    description: "Déclenché lorsque l'inscription est annulée."
</i18n>

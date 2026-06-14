<template>
  <page-state-handler
    padding
    :error="pageError"
    :loading
    class="templates-page row justify-center"
  >
    <div
      class="templates-content col-12 col-md-11 col-lg-10 column q-gutter-y-lg"
    >
      <!-- Header -->
      <div class="row items-end justify-between q-col-gutter-y-sm">
        <div class="col-12 col-sm page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('page.title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('page.description') }}
          </div>
        </div>
      </div>

      <!-- Registration events -->
      <q-card
        flat
        bordered
        class="section-card"
      >
        <q-list class="q-py-xs">
          <q-expansion-item
            v-for="{ event: eventName, templates: eventTemplates } in templates"
            :key="eventName"
            :content-inset-level="1"
            expand-separator
            group="templates"
          >
            <template #header>
              <q-item-section avatar>
                <q-icon
                  :name="TEMPLATE_ICONS[eventName] ?? 'mail_outline'"
                  color="primary"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ t(`template.${eventName ?? 'default'}.label`) }}
                </q-item-label>
                <q-item-label caption>
                  {{ t(`template.${eventName ?? 'default'}.description`) }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-list>
              <q-item
                v-for="{ country, template } in eventTemplates"
                :key="country"
                :clickable="!!template"
                :aria-label="!!template ? t('action.edit') : undefined"
                @click="editTemplate(template)"
              >
                <q-item-section avatar>
                  <country-icon :country />
                </q-item-section>

                <q-item-section>
                  {{ t(`template.${eventName ?? 'default'}.label`) }}
                  ({{ country }})
                </q-item-section>

                <q-item-section side>
                  <template v-if="template?.id">
                    <q-btn
                      v-if="
                        can('camp.message_templates.edit') ||
                        can('camp.message_templates.delete')
                      "
                      :aria-label="t('action.menu')"
                      icon="more_vert"
                      flat
                      round
                      size="sm"
                      @click.stop
                    >
                      <q-menu>
                        <q-list style="min-width: 180px">
                          <q-item
                            v-if="can('camp.message_templates.edit')"
                            clickable
                            v-close-popup
                            @click="editTemplate(template)"
                          >
                            <q-item-section avatar>
                              <q-icon
                                name="edit"
                                size="sm"
                              />
                            </q-item-section>
                            <q-item-section>
                              {{ t('action.edit') }}
                            </q-item-section>
                          </q-item>
                          <q-item
                            v-if="can('camp.message_templates.delete')"
                            clickable
                            v-close-popup
                            class="text-negative"
                            @click="deleteTemplate(template.id)"
                          >
                            <q-item-section avatar>
                              <q-icon
                                name="delete"
                                size="sm"
                              />
                            </q-item-section>
                            <q-item-section>
                              {{ t('action.delete') }}
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-btn>
                  </template>

                  <template v-else>
                    <q-btn
                      v-if="can('camp.message_templates.create')"
                      :aria-label="t('action.add')"
                      icon="add"
                      color="primary"
                      round
                      dense
                      unelevated
                      @click="addTemplate(eventName, country)"
                    />
                  </template>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </q-list>
      </q-card>
    </div>
  </page-state-handler>
</template>

<script setup lang="ts">
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import MessageEditDialog from 'components/campManagement/settings/emails/MessageEditDialog.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import type { MessageTemplate } from '@camp-registration/common/entities';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { usePermissions } from 'src/composables/permissions';
import { storeToRefs } from 'pinia';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

const {
  queryParam,
  data,
  withResultNotification,
  forceFetch,
  isLoading,
  error,
} = useServiceHandler<MessageTemplate[]>();

const api = useAPIService();
const quasar = useQuasar();
const { t } = useI18n();
const campDetailsStore = useCampDetailsStore();
const { data: camp } = storeToRefs(campDetailsStore);
const { can } = usePermissions();

onMounted(async () => {
  await Promise.allSettled([campDetailsStore.fetchData(), loadData()]);
});

const TEMPLATE_ICONS: Record<string, string> = {
  registration_submitted: 'o_assignment_turned_in',
  registration_confirmed: 'check_circle',
  registration_waitlisted: 'hourglass_empty',
  registration_waitlist_accepted: 'verified_user',
  registration_updated: 'edit',
  registration_canceled: 'cancel',
};

const TEMPLATE_ORDER = [
  'registration_submitted',
  'registration_confirmed',
  'registration_waitlisted',
  'registration_waitlist_accepted',
  'registration_updated',
  'registration_canceled',
] as const;

const loading = computed<boolean>(() => {
  return isLoading.value || campDetailsStore.isLoading;
});

const pageError = computed<string | null>(() => {
  return error.value ?? campDetailsStore.error;
});

async function loadData() {
  await forceFetch(async () => {
    return api.fetchMessageTemplates(queryParam('campId'), {
      hasEvent: true,
    });
  });
}

interface MappedTemplate {
  event: string;
  templates: {
    country: string;
    template: MessageTemplate | undefined;
  }[];
}

const templates = computed<MappedTemplate[]>(() => {
  const values = data.value;
  const countries = camp.value?.countries;
  const confirmationMode = camp.value?.confirmationMode;
  if (!values || !countries || !confirmationMode) {
    return [];
  }

  return TEMPLATE_ORDER.filter(
    (event) =>
      confirmationMode === 'MANUAL' || event !== 'registration_submitted',
  ).map((event) => ({
    event,
    templates: countries.map((country) => {
      return {
        country,
        template: values.find(
          (t) => t.event === event && t.country === country,
        ),
      };
    }),
  }));
});

function addTemplate(event: string, country: string) {
  const camp = campDetailsStore.data;
  if (!camp) {
    throw new Error('No camp details loaded!');
  }

  // Search for existing template for same event but different country
  const template = data.value?.find((template) => template.event === event);

  quasar
    .dialog({
      component: MessageEditDialog,
      componentProps: {
        name: t(`template.${event}.label`),
        event,
        country,
        form: camp.form,
        subject: template?.subject ?? '',
        body: template?.body ?? '',
        attachments: template?.attachments,

        saveFn: async (message: {
          subject: string;
          body: string;
          attachmentIds: string[] | null;
        }) => {
          await withResultNotification('create', async () => {
            return api.createMessageTemplate(camp.id, {
              event,
              country,
              subject: message.subject,
              body: message.body,
              attachmentIds: message.attachmentIds ?? undefined,
            });
          });
        },
      },
    })
    .onOk(() => {
      void loadData();
    });
}

function editTemplate(template: MessageTemplate | undefined) {
  if (!template) {
    return;
  }

  const camp = campDetailsStore.data;
  if (!camp) {
    return;
  }

  quasar
    .dialog({
      component: MessageEditDialog,
      componentProps: {
        name: t(`template.${template.event}.label`),
        event: template.event,
        country: template.country,
        form: camp.form,
        subject: template.subject,
        body: template.body,
        attachments: template.attachments,

        saveFn: async (message: {
          subject: string;
          body: string;
          attachmentIds: string[] | null;
        }) => {
          await withResultNotification('update', async () => {
            return api.updateMessageTemplate(camp.id, template.id, {
              subject: message.subject,
              body: message.body,
              attachmentIds: message.attachmentIds ?? undefined,
            });
          });
        },
      },
    })
    .onOk(() => {
      void loadData();
    });
}

async function deleteTemplate(id: string | undefined) {
  if (!id) {
    return;
  }

  const camp = campDetailsStore.data;
  if (!camp) {
    return;
  }

  await withResultNotification('delete', async () => {
    return api.deleteMessageTemplate(camp.id, id);
  }).then(async () => {
    await loadData();
  });
}
</script>

<style scoped>
.templates-content {
  max-width: 960px;
  padding-bottom: 24px;
}

/* The default page padding feels cramped under the app bar on phones. */
@media (max-width: 599px) {
  .templates-page {
    padding-top: 24px;
  }
}

.section-card {
  border-radius: 16px;
}
</style>

<i18n lang="yaml" locale="en">
action:
  add: 'Add template'
  edit: 'Edit template'
  delete: 'Delete template'
  menu: 'Actions'

page:
  title: 'Registration Events'
  description: 'Manage and edit the email templates for each registration event.'

request:
  create:
    success: 'Message template created successfully'
    error: 'Failed to create message template'
  update:
    success: 'Message template updated successfully'
    error: 'Failed to update message template'
  delete:
    success: 'Message template deleted successfully'
    error: 'Failed to delete message template'

template:
  registration_submitted:
    label: 'Registration Submitted'
    description: 'Triggered when a user submits a new registration.'
  registration_confirmed:
    label: 'Registration Confirmed'
    description: 'Triggered when a registration is accepted.'
  registration_waitlisted:
    label: 'Registration Waitlisted'
    description: 'Triggered when a registration is placed on the waitlist because the limit for this group has been reached.'
  registration_waitlist_accepted:
    label: 'Waitlist Registration Accepted'
    description: 'Triggered when a registration from the waitlist is accepted.'
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
  menu: 'Aktionen'

page:
  title: 'Anmeldeereignisse'
  description: 'Verwalten und bearbeiten Sie die E-Mail-Vorlagen für jedes Anmeldeereignis.'

request:
  create:
    success: 'Nachrichtenvorlage wurde erfolgreich erstellt'
    error: 'Fehler beim Erstellen der Nachrichtenvorlage'
  update:
    success: 'Nachrichtenvorlage wurde erfolgreich aktualisiert'
    error: 'Fehler beim Aktualisieren der Nachrichtenvorlage'
  delete:
    success: 'Nachrichtenvorlage wurde erfolgreich gelöscht'
    error: 'Fehler beim Löschen der Nachrichtenvorlage'

template:
  registration_submitted:
    label: 'Anmeldung Eingereicht'
    description: 'Wird ausgelöst, wenn ein Benutzer eine neue Anmeldung einreicht.'
  registration_confirmed:
    label: 'Anmeldung Bestätigt'
    description: 'Wird ausgelöst, wenn eine Anmeldung bestätigt wird.'
  registration_waitlisted:
    label: 'Anmeldung auf Warteliste'
    description: 'Wird ausgelöst, wenn eine Registrierung auf die Warteliste gesetzt wird, weil das Limit für diese Gruppe erreicht ist.'
  registration_waitlist_accepted:
    label: 'Wartelistenanmeldung Akzeptiert'
    description: 'Wird ausgelöst, wenn eine Registrierung von der Warteliste akzeptiert wird.'
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
  menu: 'Actions'

page:
  title: "Événements d'Inscription"
  description: "Gérez et modifiez les modèles d'e-mails pour chaque événement d'inscription."

request:
  create:
    success: 'Le modèle de message a été créé avec succès'
    error: 'Échec de la création du modèle de message'
  update:
    success: 'Le modèle de message a été mis à jour avec succès'
    error: 'Échec de la mise à jour du modèle de message'
  delete:
    success: 'Le modèle de message a été supprimé avec succès'
    error: 'Échec de la suppression du modèle de message'

template:
  registration_submitted:
    label: 'Inscription Soumise'
    description: "Déclenché lorsqu'un utilisateur soumet une nouvelle inscription."
  registration_confirmed:
    label: 'Inscription Confirmée'
    description: "Déclenché lorsqu'une inscription est acceptée."
  registration_waitlisted:
    label: "Inscription en Liste d'Attente"
    description: "Déclenché lorsqu'une inscription est placée sur la liste d'attente parce que la limite pour ce groupe a été atteinte."
  registration_waitlist_accepted:
    label: "Inscription Acceptée depuis la Liste d'Attente"
    description: "Déclenché lorsqu'une inscription provenant de la liste d'attente est acceptée."
  registration_updated:
    label: 'Inscription Mise à Jour'
    description: "Déclenché lorsque des détails d'une inscription sont mis à jour après sa soumission."
  registration_canceled:
    label: 'Inscription Annulée'
    description: "Déclenché lorsque l'inscription est annulée."
</i18n>

<i18n lang="yaml" locale="pl">
action:
  add: 'Dodaj szablon'
  edit: 'Edytuj szablon'
  delete: 'Usuń szablon'
  menu: 'Akcje'

page:
  title: 'Zdarzenia rejestracji'
  description: 'Zarządzaj i edytuj szablony e-maili dla każdego zdarzenia rejestracyjnego.'

request:
  create:
    success: 'Szablon wiadomości został pomyślnie utworzony'
    error: 'Błąd podczas tworzenia szablonu wiadomości'
  update:
    success: 'Szablon wiadomości został pomyślnie zaktualizowany'
    error: 'Błąd podczas aktualizowania szablonu wiadomości'
  delete:
    success: 'Szablon wiadomości został pomyślnie usunięty'
    error: 'Błąd podczas usuwania szablonu wiadomości'

template:
  registration_submitted:
    label: 'Rejestracja przesłana'
    description: 'Wyzwalane, gdy użytkownik przesyła nową rejestrację.'
  registration_confirmed:
    label: 'Rejestracja potwierdzona'
    description: 'Wyzwalane po zaakceptowaniu rejestracji.'
  registration_waitlisted:
    label: 'Rejestracja na liście oczekujących'
    description: 'Wyzwalane, gdy rejestracja zostaje umieszczona na liście oczekujących, ponieważ limit dla tej grupy został osiągnięty.'
  registration_waitlist_accepted:
    label: 'Rejestracja z listy oczekujących zaakceptowana'
    description: 'Wyzwalane, gdy rejestracja z listy oczekujących zostanie zaakceptowana.'
  registration_updated:
    label: 'Rejestracja zaktualizowana'
    description: 'Wyzwalane, gdy szczegóły rejestracji zostają zaktualizowane po jej przesłaniu.'
  registration_canceled:
    label: 'Rejestracja anulowana'
    description: 'Wyzwalane, gdy rejestracja zostaje anulowana.'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  add: 'Přidat šablonu'
  edit: 'Upravit šablonu'
  delete: 'Smazat šablonu'
  menu: 'Akce'

page:
  title: 'Události registrace'
  description: 'Spravujte a upravujte e-mailové šablony pro jednotlivé registrační události.'

request:
  create:
    success: 'Šablona zprávy byla úspěšně vytvořena'
    error: 'Chyba při vytváření šablony zprávy'
  update:
    success: 'Šablona zprávy byla úspěšně aktualizována'
    error: 'Chyba při aktualizaci šablony zprávy'
  delete:
    success: 'Šablona zprávy byla úspěšně smazána'
    error: 'Chyba při mazání šablony zprávy'

template:
  registration_submitted:
    label: 'Registrace odeslána'
    description: 'Spouští se, když uživatel odešle novou registraci.'
  registration_confirmed:
    label: 'Registrace potvrzena'
    description: 'Spustí se, když je registrace přijata.'
  registration_waitlisted:
    label: 'Registrace na čekací listině'
    description: 'Spustí se, když je registrace zařazena na čekací listinu, protože byl dosažen limit pro tuto skupinu.'
  registration_waitlist_accepted:
    label: 'Registrace z čekací listiny přijata'
    description: 'Spustí se, když je přijata registrace z čekací listiny.'
  registration_updated:
    label: 'Registrace aktualizována'
    description: 'Spouští se, když jsou po odeslání registrace aktualizovány její údaje.'
  registration_canceled:
    label: 'Registrace zrušena'
    description: 'Spouští se, když je registrace zrušena.'
</i18n>

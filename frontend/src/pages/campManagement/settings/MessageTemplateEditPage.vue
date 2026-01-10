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
            <template v-if="id">
              <q-btn
                v-if="
                  can('camp.message_templates.edit') ||
                  can('camp.message_templates.delete')
                "
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
                      v-if="can('camp.message_templates.edit')"
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
                      v-if="can('camp.message_templates.delete')"
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
                @click="addTemplate(name)"
              />
            </template>
          </q-item-section>
        </q-item>
      </q-list>
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

const TEMPLATE_ORDER: string[] = [
  'registration_submitted',
  'registration_confirmed',
  'registration_waitlisted',
  'registration_waitlist_accepted',
  'registration_updated',
  'registration_canceled',
];

interface CMessageTemplate extends MessageTemplate {
  event: string;
  loading: boolean;
}

const loading = computed<boolean>(() => {
  return isLoading.value;
});

async function loadData() {
  await forceFetch(async () => {
    return api.fetchMessageTemplates(queryParam('camp'), {
      includeDefaults: true,
      hasEvent: true,
    });
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
    })
    .toSorted(
      (a, b) =>
        TEMPLATE_ORDER.indexOf(a.event) - TEMPLATE_ORDER.indexOf(b.event),
    );
  //
});

function templateHasEvent(
  template: MessageTemplate,
): template is MessageTemplate & { event: string } {
  return template.event !== null;
}

function findTemplateByEvent(event: string): CMessageTemplate {
  const template = templates.value.find((template) => template.event === event);
  if (!template) {
    throw new Error('No message template found for event: ' + event);
  }

  return template;
}

function findTemplateById(id: string): CMessageTemplate {
  const template = templates.value.find((template) => template.id === id);
  if (!template) {
    throw new Error('No message template found with id: ' + id);
  }

  return template;
}

function addTemplate(event: string) {
  const camp = campDetailsStore.data;
  if (!camp) {
    throw new Error('No camp details loaded!');
  }

  const template = findTemplateByEvent(event);

  quasar
    .dialog({
      component: MessageEditDialog,
      componentProps: {
        name: t(`template.${template.event}.label`),
        form: camp.form,
        countries: camp.countries,
        subject: template.subject,
        body: template.body,
      },
    })
    .onOk((message) => {
      void withResultNotification('create', async () => {
        return api.createMessageTemplate(camp.id, {
          event,
          subject: message.subject,
          body: message.body,
        });
      }).then(async () => {
        await loadData();
      });
    });
}

function editTemplate(id: string | undefined | null) {
  if (!id) {
    return;
  }

  const camp = campDetailsStore.data;
  if (!camp) {
    return;
  }

  const template = findTemplateById(id);

  quasar
    .dialog({
      component: MessageEditDialog,
      componentProps: {
        name: t(`template.${template.event}.label`),
        form: camp.form,
        countries: camp.countries,
        subject: template.subject,
        body: template.body,
      },
    })
    .onOk((message) => {
      void withResultNotification('update', async () => {
        return api.updateMessageTemplate(camp.id, id, {
          subject: message.subject,
          body: message.body,
        });
      }).then(async () => {
        await loadData();
      });
    });
}

function deleteTemplate(id: string | undefined) {
  if (!id) {
    return;
  }

  const camp = campDetailsStore.data;
  if (!camp) {
    return;
  }

  void withResultNotification('delete', async () => {
    return api.deleteMessageTemplate(camp.id, id);
  }).then(async () => {
    await loadData();
  });
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

<i18n lang="yaml" locale="pl">
action:
  add: 'Dodaj szablon'
  edit: 'Edytuj szablon'
  delete: 'Usuń szablon'

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
    description: 'Wyzwalane, gdy rejestracja zostaje potwierdzona bez umieszczania na liście oczekujących.'
  registration_waitlisted:
    label: 'Rejestracja na liście oczekujących'
    description: 'Wyzwalane, gdy rejestracja zostaje umieszczona na liście oczekujących, ponieważ limit dla tego kraju został osiągnięty.'
  registration_waitlist_accepted:
    label: 'Rejestracja z listy oczekujących zaakceptowana'
    description: 'Wyzwalane, gdy rejestracja z listy oczekujących zostaje potwierdzona.'
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
    description: 'Spouští se, když je registrace potvrzena přímo a není na čekací listině.'
  registration_waitlisted:
    label: 'Registrace na čekací listině'
    description: 'Spouští se, když je registrace zařazena na čekací listinu, protože byl dosažen limit pro tuto zemi.'
  registration_waitlist_accepted:
    label: 'Registrace z čekací listiny přijata'
    description: 'Spouští se, když je registrace z čekací listiny potvrzena.'
  registration_updated:
    label: 'Registrace aktualizována'
    description: 'Spouští se, když jsou po odeslání registrace aktualizovány její údaje.'
  registration_canceled:
    label: 'Registrace zrušena'
    description: 'Spouští se, když je registrace zrušena.'
</i18n>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin rounded-xl"
      data-test="event-organization-required"
    >
      <q-card-section>
        <div class="text-h6">{{ t(`${reason}.title`) }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <p class="text-body2 q-mb-sm">
          {{
            reason === 'none'
              ? t('none.message')
              : t(
                  'forbidden.message',
                  { name: names },
                  organizationNames.length,
                )
          }}
        </p>
        <p class="text-body2 text-on-surface-variant q-mb-none">
          {{ t('invite_hint', { email: user?.email ?? '' }) }}
        </p>
      </q-card-section>

      <q-card-actions align="right">
        <m-btn
          text
          primary
          :label="t('cancel')"
          @click="onDialogCancel"
        />
        <m-btn
          primary
          icon="add"
          :label="t('action')"
          data-test="event-organization-required-create"
          @click="onDialogOK()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { useProfileStore } from '@/stores/profile-store';

const props = defineProps<{
  // `forbidden`: a member somewhere, but no role there may create events.
  reason: 'none' | 'forbidden';
  organizationNames?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, locale } = useI18n();
const { user } = storeToRefs(useProfileStore());

const organizationNames = computed(() => props.organizationNames ?? []);
const names = computed(() =>
  new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(
    organizationNames.value,
  ),
);
</script>

<i18n lang="yaml" locale="en">
none:
  title: 'Organization required'
  message: 'Events are run by an organization, which is responsible for the event and the data people enter when they register. Create one to get started — you can set up your event right after, even before the organization is verified.'
forbidden:
  title: 'No permission to create events'
  message: "Your role in {name} can't create events. Ask an admin of your organization, or create your own. | Your roles in {name} can't create events. Ask an admin of your organization, or create your own."
invite_hint: 'Already part of an organization? Ask its admin to add you using {email}.'
action: 'Create organization'
cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
none:
  title: 'Organisation erforderlich'
  message: 'Veranstaltungen werden von einer Organisation betrieben, die für die Veranstaltung und die bei der Anmeldung erhobenen Daten verantwortlich ist. Erstelle eine, um loszulegen — deine Veranstaltung kannst du direkt danach einrichten, auch vor der Verifizierung.'
forbidden:
  title: 'Keine Berechtigung zum Erstellen von Veranstaltungen'
  message: 'Deine Rolle in {name} darf keine Veranstaltungen erstellen. Frag einen Admin deiner Organisation oder erstelle deine eigene. | Deine Rollen in {name} dürfen keine Veranstaltungen erstellen. Frag einen Admin deiner Organisation oder erstelle deine eigene.'
invite_hint: 'Gehörst du schon zu einer Organisation? Bitte ihren Admin, dich mit {email} hinzuzufügen.'
action: 'Organisation erstellen'
cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
none:
  title: 'Organisation requise'
  message: "Les événements sont gérés par une organisation, responsable de l'événement et des données saisies lors des inscriptions. Crée-en une pour commencer — tu pourras préparer ton événement juste après, même avant la vérification."
forbidden:
  title: "Pas d'autorisation pour créer des événements"
  message: 'Ton rôle dans {name} ne permet pas de créer des événements. Demande à un administrateur de ton organisation, ou crée la tienne. | Tes rôles dans {name} ne permettent pas de créer des événements. Demande à un administrateur de ton organisation, ou crée la tienne.'
invite_hint: "Tu fais déjà partie d'une organisation ? Demande à son administrateur de t'ajouter avec {email}."
action: 'Créer une organisation'
cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
none:
  title: 'Wymagana organizacja'
  message: 'Wydarzenia prowadzi organizacja, która odpowiada za wydarzenie i dane podawane podczas zapisów. Utwórz ją, aby zacząć — wydarzenie możesz przygotować zaraz potem, jeszcze przed weryfikacją.'
forbidden:
  title: 'Brak uprawnień do tworzenia wydarzeń'
  message: 'Twoja rola w {name} nie pozwala tworzyć wydarzeń. Poproś administratora swojej organizacji albo utwórz własną. | Twoje role w {name} nie pozwalają tworzyć wydarzeń. Poproś administratora swojej organizacji albo utwórz własną.'
invite_hint: 'Należysz już do organizacji? Poproś jej administratora, aby dodał cię, używając adresu {email}.'
action: 'Utwórz organizację'
cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
none:
  title: 'Vyžadována organizace'
  message: 'Akce pořádá organizace, která odpovídá za akci i za údaje zadané při přihlašování. Vytvoř si ji a začni — akci můžeš připravit hned poté, i před ověřením.'
forbidden:
  title: 'Nemáš oprávnění vytvářet akce'
  message: 'Tvoje role v {name} nemůže vytvářet akce. Požádej správce své organizace, nebo si vytvoř vlastní. | Tvoje role v {name} nemohou vytvářet akce. Požádej správce své organizace, nebo si vytvoř vlastní.'
invite_hint: 'Už patříš do nějaké organizace? Požádej jejího správce, ať tě přidá pod adresou {email}.'
action: 'Vytvořit organizaci'
cancel: 'Zrušit'
</i18n>

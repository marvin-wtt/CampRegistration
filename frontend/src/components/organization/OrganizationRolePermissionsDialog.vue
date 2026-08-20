<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin"
      style="min-width: 20rem; max-width: 32rem"
    >
      <q-card-section class="text-h6">{{ t('title') }}</q-card-section>

      <q-card-section class="q-pt-none">
        <div
          v-for="role in roles"
          :key="role"
          class="q-mb-md"
        >
          <div class="text-subtitle2">{{ t(`role.${role}.title`) }}</div>
          <q-list dense>
            <q-item
              v-for="(line, index) in tm(`role.${role}.can`)"
              :key="index"
              class="q-pl-none"
            >
              <q-item-section avatar>
                <q-icon
                  name="check"
                  color="positive"
                  size="xs"
                />
              </q-item-section>
              <q-item-section>{{ rt(line) }}</q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-banner
          dense
          class="camp-access-note rounded-md"
        >
          <template #avatar>
            <q-icon name="info" />
          </template>
          {{ t('campAccess') }}
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('action.close')"
          flat
          rounded
          color="primary"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { OrganizationRole } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
// Wrapped rather than destructured: `tm` and `rt` read `this` internally, and
// the role capability lists are message arrays that need both.
const i18n = useI18n();
type Message = Parameters<typeof i18n.rt>[0];

const t = (key: string) => i18n.t(key);
const tm = (key: string) => i18n.tm(key);
const rt = (value: Message) => i18n.rt(value);
defineEmits([...useDialogPluginComponent.emits]);

const roles: OrganizationRole[] = ['ADMIN', 'MEMBER'];
</script>

<style lang="scss" scoped>
.camp-access-note {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Roles in this organization'
role:
  ADMIN:
    title: 'Admin'
    can:
      - 'Edit the organization and submit it for verification'
      - 'Add, change and remove members'
      - 'Create camps and newsletters'
      - 'Delete the organization'
  MEMBER:
    title: 'Member'
    can:
      - 'See the organization and its members'
      - 'Create camps under the organization'
campAccess: 'Admins can see every camp of this organization and close its registration, but never its registrations or participant data. Access to participant data always requires a separate camp invitation.'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Rollen in dieser Organisation'
role:
  ADMIN:
    title: 'Admin'
    can:
      - 'Organisation bearbeiten und zur Verifizierung einreichen'
      - 'Mitglieder hinzufügen, ändern und entfernen'
      - 'Camps und Newsletter erstellen'
      - 'Organisation löschen'
  MEMBER:
    title: 'Mitglied'
    can:
      - 'Organisation und ihre Mitglieder sehen'
      - 'Camps der Organisation anlegen'
campAccess: 'Admins sehen jedes Camp dieser Organisation und können dessen Anmeldung schließen, aber niemals die Anmeldungen oder Teilnehmerdaten. Dafür ist immer eine separate Camp-Einladung nötig.'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Rôles dans cette organisation'
role:
  ADMIN:
    title: 'Admin'
    can:
      - "Modifier l'organisation et la soumettre à vérification"
      - 'Ajouter, modifier et retirer des membres'
      - 'Créer des camps et des newsletters'
      - "Supprimer l'organisation"
  MEMBER:
    title: 'Membre'
    can:
      - "Voir l'organisation et ses membres"
      - "Créer des camps pour l'organisation"
campAccess: 'Les admins voient tous les camps de cette organisation et peuvent en fermer les inscriptions, mais jamais les inscriptions ni les données des participants. Cela nécessite toujours une invitation distincte au camp.'
action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Role w tej organizacji'
role:
  ADMIN:
    title: 'Administrator'
    can:
      - 'Edytowanie organizacji i zgłaszanie jej do weryfikacji'
      - 'Dodawanie, zmiana i usuwanie członków'
      - 'Tworzenie obozów i newsletterów'
      - 'Usuwanie organizacji'
  MEMBER:
    title: 'Członek'
    can:
      - 'Podgląd organizacji i jej członków'
      - 'Tworzenie obozów w organizacji'
campAccess: 'Administratorzy widzą każdy obóz tej organizacji i mogą zamknąć jego rejestrację, ale nigdy nie widzą zgłoszeń ani danych uczestników. Do tego zawsze potrzebne jest osobne zaproszenie do obozu.'
action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Role v této organizaci'
role:
  ADMIN:
    title: 'Správce'
    can:
      - 'Upravovat organizaci a odeslat ji k ověření'
      - 'Přidávat, měnit a odebírat členy'
      - 'Vytvářet tábory a newslettery'
      - 'Smazat organizaci'
  MEMBER:
    title: 'Člen'
    can:
      - 'Vidět organizaci a její členy'
      - 'Vytvářet tábory organizace'
campAccess: 'Správci vidí každý tábor této organizace a mohou uzavřít jeho registraci, nikdy však registrace ani údaje účastníků. K tomu je vždy potřeba samostatné pozvání do tábora.'
action:
  close: 'Zavřít'
</i18n>

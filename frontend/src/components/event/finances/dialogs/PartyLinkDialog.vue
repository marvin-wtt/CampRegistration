<template>
  <!-- Files a typed name's receipts and payouts under a manager's account,
       e.g. once that person has joined: one balance instead of two. -->
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      icon="link"
      @submit="save"
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap q-gutter-y-md">
        <p class="text-body2 q-mb-none">
          {{ t('intro', { name }) }}
        </p>
        <q-select
          v-model="userId"
          :options="managers"
          :label="t('account')"
          :rules="[(val: string | null) => !!val || t('required')]"
          emit-value
          map-options
          outlined
          rounded
          hide-bottom-space
          data-test="party-link-account"
        >
          <template #option="{ opt, itemProps }">
            <q-item v-bind="itemProps">
              <q-item-section>
                <q-item-label>{{ opt.label }}</q-item-label>
                <q-item-label caption>{{ opt.caption }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-banner
          dense
          rounded
          class="bg-surface-container-high text-on-surface"
        >
          <template #avatar>
            <q-icon
              name="info"
              color="on-surface-variant"
            />
          </template>
          {{ t('note', { name }) }}
        </q-banner>
      </div>

      <template #actions>
        <m-btn
          :label="t('finance.action.cancel')"
          text
          rounded
          color="primary"
          @click="onDialogCancel"
        />
        <m-btn
          :label="t('link')"
          :loading="saving"
          rounded
          color="primary"
          type="submit"
          data-test="party-link-save"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import { useFinanceStore } from '@/stores/finance-store';

const { name, suggested = null } = defineProps<{
  /** The typed name, exactly as the records hold it. */
  name: string;
  /** The manager it most likely is: preselected. */
  suggested?: string | null;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t } = useI18n();
const financeStore = useFinanceStore();
const { parties } = storeToRefs(financeStore);

const managers = computed(() =>
  (parties.value?.managers ?? []).map((m) => ({
    value: m.userId,
    label: m.name,
    caption: t(`finance.role.${m.role.toLowerCase()}`),
  })),
);

const userId = ref<string | null>(suggested);
const saving = ref(false);

async function save() {
  if (!userId.value) {
    return;
  }
  saving.value = true;
  try {
    onDialogOK(await financeStore.linkParty({ name, userId: userId.value }));
  } catch {
    // Reported by the store; the dialog stays open for another try.
  } finally {
    saving.value = false;
  }
}
</script>

<i18n lang="yaml" locale="en">
title: 'Link to an account'
intro: 'Files every receipt and payout under “{name}” to a manager’s account. Their balance then shows as one.'
account: 'Manager'
required: 'Pick a manager'
note: 'Only this exact spelling of “{name}” moves. Payout statements already printed for them may then show as outdated.'
link: 'Link'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Mit einem Konto verknüpfen'
intro: 'Ordnet alle Belege und Auszahlungen von „{name}“ dem Konto einer Leitungsperson zu. Ihr Saldo erscheint dann als einer.'
account: 'Leitungsperson'
required: 'Wähle eine Leitungsperson'
note: 'Nur genau diese Schreibweise von „{name}“ wird übernommen. Bereits gedruckte Auszahlungsbelege können danach als veraltet gelten.'
link: 'Verknüpfen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Rattacher à un compte'
intro: 'Rattache tous les justificatifs et versements de « {name} » au compte d’un responsable. Son solde n’apparaît alors plus qu’une fois.'
account: 'Responsable'
required: 'Choisissez un responsable'
note: 'Seule cette orthographe exacte de « {name} » est rattachée. Les relevés de versement déjà imprimés peuvent alors apparaître comme obsolètes.'
link: 'Rattacher'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Połącz z kontem'
intro: 'Przypisuje wszystkie dowody i wypłaty „{name}” do konta osoby zarządzającej. Jej saldo będzie wtedy widoczne jako jedno.'
account: 'Osoba zarządzająca'
required: 'Wybierz osobę zarządzającą'
note: 'Przenoszona jest tylko dokładnie ta pisownia „{name}”. Wydrukowane już zestawienia wypłat mogą potem być oznaczone jako nieaktualne.'
link: 'Połącz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Propojit s účtem'
intro: 'Přiřadí všechny doklady a výplaty „{name}“ k účtu vedoucího. Jeho zůstatek se pak zobrazí jako jeden.'
account: 'Vedoucí'
required: 'Vyber vedoucího'
note: 'Přesune se jen přesně tento zápis „{name}“. Už vytištěné výpisy výplat se pak mohou zobrazit jako zastaralé.'
link: 'Propojit'
</i18n>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onCancelClick"
      >
        <q-card-section>
          <div class="text-h6">
            {{ t('title') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md column">
          <q-toggle
            v-model="enabled"
            :label="t('field.enabled.label')"
          />

          <!-- Only while turning the link on: `props.enabled` is the
               server's own state (it was off before this dialog opened),
               and `enabled` is the toggle above being switched on right now.
               Once the link is already live, publishing days is the
               per-day header's job, not a bulk action tucked in here. -->
          <template v-if="!props.enabled && enabled">
            <q-select
              v-model="publishAllPlan"
              :label="t('field.publishAll.label')"
              :hint="t('field.publishAll.hint')"
              :options="publishAllOptions"
              emit-value
              map-options
              outlined
              rounded
            />
          </template>

          <template v-if="enabled">
            <q-input
              :model-value="publicUrl"
              :label="t('field.link.label')"
              readonly
              outlined
              rounded
              hide-bottom-space
            >
              <template #append>
                <q-btn
                  icon="content_copy"
                  flat
                  round
                  dense
                  @click="copyLink"
                >
                  <q-tooltip>{{ t('field.link.copy') }}</q-tooltip>
                </q-btn>
              </template>
            </q-input>

            <div class="text-caption text-grey-7">
              {{ t('field.perDayHint') }}
            </div>

            <q-toggle
              v-model="allowPastDates"
              :label="t('field.allowPastDates.label')"
            />
            <div class="text-caption text-grey-7">
              {{ t('field.allowPastDates.caption') }}
            </div>
          </template>
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('actions.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('actions.save')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { copyToClipboard, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { computed, ref } from 'vue';

const props = defineProps<{
  enabled: boolean;
  allowPastDates: boolean;
  eventId: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const quasar = useQuasar();
const router = useRouter();

const enabled = ref(props.enabled);
const allowPastDates = ref(props.allowPastDates);

type PublishAllPlan = 'unpublished' | 'a' | 'b' | 'both';

const publishAllPlan = ref<PublishAllPlan>('unpublished');
const publishAllOptions = computed<{ label: string; value: PublishAllPlan }[]>(
  () => [
    { label: t('field.publishAll.option.unpublished'), value: 'unpublished' },
    { label: t('field.publishAll.option.a'), value: 'a' },
    { label: t('field.publishAll.option.b'), value: 'b' },
    { label: t('field.publishAll.option.both'), value: 'both' },
  ],
);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const publicUrl = computed<string>(() => {
  return (
    window.location.origin +
    router.resolve({
      name: 'event.program',
      params: { eventId: props.eventId },
    }).href
  );
});

async function copyLink() {
  try {
    await copyToClipboard(publicUrl.value);
    quasar.notify({
      type: 'positive',
      message: t('field.link.copySuccess'),
      icon: 'assignment_turned_in',
    });
  } catch {
    quasar.notify({
      type: 'negative',
      message: t('field.link.copyFail'),
    });
  }
}

function onOKClick() {
  onDialogOK({
    enabled: enabled.value,
    allowPastDates: allowPastDates.value,
    publishAllPlan: publishAllPlan.value,
  });
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Public program link'
field:
  enabled:
    label: 'Publish the program publicly'
  link:
    label: 'Public link'
    copy: 'Copy link'
    copySuccess: 'Link copied to clipboard'
    copyFail: 'Failed to copy link to clipboard'
  perDayHint: 'Publish or unpublish individual days, and choose which plan they show, from that day’s own header in the calendar.'
  publishAll:
    label: 'Publish all days as'
    hint: 'When saved, every day of the event is set to this plan. Leave "Not published" to skip.'
    option:
      unpublished: 'Not published'
      a: 'Plan A'
      b: 'Plan B'
      both: 'Both plans'
  allowPastDates:
    label: 'Show past days'
    caption: 'When off, the public link only shows days from today onward, even if the event started earlier.'
actions:
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Öffentlicher Programmlink'
field:
  enabled:
    label: 'Programm öffentlich veröffentlichen'
  link:
    label: 'Öffentlicher Link'
    copy: 'Link kopieren'
    copySuccess: 'Link in die Zwischenablage kopiert'
    copyFail: 'Link konnte nicht kopiert werden'
  perDayHint: 'Einzelne Tage werden über die Kopfzeile des jeweiligen Tages im Kalender veröffentlicht oder zurückgezogen — dort wird auch der sichtbare Plan festgelegt.'
  publishAll:
    label: 'Alle Tage veröffentlichen als'
    hint: 'Beim Speichern wird jeder Tag der Veranstaltung auf diesen Plan gesetzt. „Nicht veröffentlicht“ überspringt dies.'
    option:
      unpublished: 'Nicht veröffentlicht'
      a: 'Plan A'
      b: 'Plan B'
      both: 'Beide Pläne'
  allowPastDates:
    label: 'Vergangene Tage anzeigen'
    caption: 'Wenn deaktiviert, zeigt der öffentliche Link nur Tage ab heute, auch wenn die Veranstaltung früher begonnen hat.'
actions:
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Lien public du programme'
field:
  enabled:
    label: 'Publier le programme publiquement'
  link:
    label: 'Lien public'
    copy: 'Copier le lien'
    copySuccess: 'Lien copié dans le presse-papiers'
    copyFail: 'Échec de la copie du lien'
  perDayHint: "Publiez ou dépubliez chaque jour individuellement, et choisissez le plan affiché, depuis l'en-tête de ce jour dans le calendrier."
  publishAll:
    label: 'Publier tous les jours en tant que'
    hint: "Une fois enregistré, chaque jour de l'événement est réglé sur ce plan. Laissez « Non publié » pour ignorer."
    option:
      unpublished: 'Non publié'
      a: 'Plan A'
      b: 'Plan B'
      both: 'Les deux plans'
  allowPastDates:
    label: 'Afficher les jours passés'
    caption: "Si désactivé, le lien public n'affiche les jours qu'à partir d'aujourd'hui, même si l'événement a commencé plus tôt."
actions:
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Publiczny link do programu'
field:
  enabled:
    label: 'Opublikuj program publicznie'
  link:
    label: 'Publiczny link'
    copy: 'Kopiuj link'
    copySuccess: 'Link skopiowany do schowka'
    copyFail: 'Nie udało się skopiować linku'
  perDayHint: 'Publikuj lub cofaj publikację poszczególnych dni oraz wybieraj widoczny plan bezpośrednio w nagłówku danego dnia w kalendarzu.'
  publishAll:
    label: 'Opublikuj wszystkie dni jako'
    hint: 'Po zapisaniu każdy dzień wydarzenia zostanie ustawiony na ten plan. Pozostaw „Nieopublikowany”, aby pominąć.'
    option:
      unpublished: 'Nieopublikowany'
      a: 'Plan A'
      b: 'Plan B'
      both: 'Oba plany'
  allowPastDates:
    label: 'Pokazuj minione dni'
    caption: 'Gdy wyłączone, publiczny link pokazuje program tylko od dzisiaj, nawet jeśli wydarzenie rozpoczęło się wcześniej.'
actions:
  save: 'Zapisz'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Veřejný odkaz na program'
field:
  enabled:
    label: 'Zveřejnit program veřejně'
  link:
    label: 'Veřejný odkaz'
    copy: 'Kopírovat odkaz'
    copySuccess: 'Odkaz zkopírován do schránky'
    copyFail: 'Odkaz se nepodařilo zkopírovat'
  perDayHint: 'Jednotlivé dny zveřejňujte nebo skrývejte a vybírejte zobrazený plán přímo v záhlaví daného dne v kalendáři.'
  publishAll:
    label: 'Zveřejnit všechny dny jako'
    hint: 'Po uložení bude každý den akce nastaven na tento plán. Ponechte „Nezveřejněno“ pro přeskočení.'
    option:
      unpublished: 'Nezveřejněno'
      a: 'Plán A'
      b: 'Plán B'
      both: 'Oba plány'
  allowPastDates:
    label: 'Zobrazovat minulé dny'
    caption: 'Když je vypnuto, veřejný odkaz zobrazuje program jen od dneška, i když akce začala dříve.'
actions:
  save: 'Uložit'
  cancel: 'Zrušit'
</i18n>

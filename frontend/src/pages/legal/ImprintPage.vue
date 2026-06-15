<template>
  <q-page class="row justify-center q-pa-md">
    <div class="col-12 col-md-8 col-lg-6 q-py-lg">
      <m-btn
        flat
        round
        icon="arrow_back"
        :aria-label="t('back')"
        class="q-mb-md"
        @click="goBack"
      />

      <div class="text-h4 q-mb-lg">
        {{ t('title') }}
      </div>

      <q-banner
        rounded
        class="bg-surface-container-low text-on-surface-variant"
      >
        <template #avatar>
          <q-icon name="info" />
        </template>
        {{ t('placeholder') }}
      </q-banner>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import { useRouter } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();
const router = useRouter();

useMeta(() => {
  return {
    title: t('title'),
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push('/');
  }
}
</script>

<i18n lang="yaml" locale="en">
title: 'Imprint'
back: 'Back'
placeholder: 'The imprint content has not been added yet. Replace this placeholder with the legally required information about the camp organizer.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Impressum'
back: 'Zurück'
placeholder: 'Der Inhalt des Impressums wurde noch nicht hinzugefügt. Ersetze diesen Platzhalter durch die gesetzlich vorgeschriebenen Angaben zum Veranstalter.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Mentions légales'
back: 'Retour'
placeholder: "Le contenu des mentions légales n'a pas encore été ajouté. Remplacez cet espace réservé par les informations légalement requises sur l'organisateur du camp."
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Nota prawna'
back: 'Wstecz'
placeholder: 'Treść noty prawnej nie została jeszcze dodana. Zastąp ten symbol zastępczy wymaganymi prawem informacjami o organizatorze obozu.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Tiráž'
back: 'Zpět'
placeholder: 'Obsah tiráže zatím nebyl přidán. Nahraďte tento zástupný text zákonem požadovanými informacemi o pořadateli tábora.'
</i18n>

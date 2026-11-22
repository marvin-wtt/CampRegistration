<template>
  <section
    class="privacy"
    aria-labelledby="landing-privacy-title"
    data-test="landing-privacy"
  >
    <header class="privacy__header">
      <span class="privacy__eyebrow">{{ t('eyebrow') }}</span>
      <h2
        id="landing-privacy-title"
        class="privacy__title"
      >
        {{ t('title') }}
      </h2>
      <p class="privacy__subtitle">{{ t('subtitle') }}</p>
    </header>

    <!-- A registration's data in the order it meets each tool. -->
    <ol class="privacy__stages">
      <li
        v-for="(stage, index) in stages"
        :key="stage.name"
        class="stage"
        :data-test="`landing-privacy-${stage.name}`"
      >
        <span
          class="stage__marker"
          aria-hidden="true"
        >
          <q-icon
            :name="stage.icon"
            size="22px"
          />
        </span>
        <div class="stage__body">
          <span
            class="stage__number"
            aria-hidden="true"
          >
            {{ index + 1 }}
          </span>
          <h3 class="stage__title">{{ t(`stage.${stage.name}.title`) }}</h3>
          <p class="stage__text">{{ t(`stage.${stage.name}.text`) }}</p>
        </div>
      </li>
    </ol>

    <!-- Says plainly what the tools do not take over. -->
    <div class="privacy__note">
      <q-icon
        name="balance"
        size="22px"
        class="privacy__note-icon"
      />
      <p class="privacy__note-text">
        {{ t('note') }}
        <router-link
          :to="{ name: 'privacy-policy' }"
          class="privacy__note-link"
          data-test="landing-privacy-policy"
        >
          {{ t('policy_link') }}
        </router-link>
      </p>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const stages = [
  { name: 'inform', icon: 'description' },
  { name: 'consent', icon: 'task_alt' },
  { name: 'covered', icon: 'rule' },
  { name: 'remind', icon: 'notifications_active' },
  { name: 'delete', icon: 'auto_delete' },
] as const;
</script>

<style lang="scss" scoped>
.privacy {
  width: 100%;
  max-width: 1080px;
  padding-top: clamp(56px, 10vh, 104px);
}

.privacy__header {
  max-width: 62ch;
}

.privacy__eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md3-primary);
}

.privacy__title {
  margin: 10px 0 0;
  font-size: clamp(1.6rem, 3.2vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--md3-on-surface);
}

.privacy__subtitle {
  margin: 12px 0 0;
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--md3-on-surface-variant);
}

/* ======================================================== STAGES */
/* Wide screens: five columns joined by a line through the markers.
   Narrow screens: a vertical timeline with the line on the left. */
.privacy__stages {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;

  &::before {
    content: '';
    position: absolute;
    top: 24px;
    left: 24px;
    right: 24px;
    height: 2px;
    background: var(--md3-outline-variant);
  }
}

.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: var(--md3-on-primary-container);
  /* Opaque, so it covers the connecting line behind it. */
  background: var(--md3-primary-container);
}

.stage__body {
  flex: 1 1 auto;
  padding: 18px;
  border-radius: 24px;
  background: var(--md3-surface-container-low);
}

.stage__number {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--md3-primary);
}

.stage__title {
  margin: 4px 0 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--md3-on-surface);
}

.stage__text {
  margin: 8px 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--md3-on-surface-variant);
}

/* ========================================================== NOTE */
.privacy__note {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-top: 20px;
  padding: 18px 22px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 24px;
}

.privacy__note-icon {
  flex: 0 0 auto;
  color: var(--md3-tertiary);
}

.privacy__note-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--md3-on-surface-variant);
}

.privacy__note-link {
  font-weight: 600;
  color: var(--md3-primary);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .privacy__stages {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;

    &::before {
      top: 24px;
      bottom: 24px;
      left: 23px;
      right: auto;
      width: 2px;
      height: auto;
    }
  }

  .stage {
    flex-direction: row;
    align-items: flex-start;
  }
}
</style>

<i18n lang="yaml" locale="en">
eyebrow: 'Privacy by design'
title: 'Participant data, handled with care'
subtitle: 'From the first question to the final deletion, @:app_name gives your organisation a clear structure for handling registration data. This is what happens to it along the way.'
stage:
  inform:
    title: 'Information first'
    text: 'Your organisation describes what it collects and why, and each event adds what is specific to it. Registrants find it at a permanent link, also in their confirmation email.'
  consent:
    title: 'Consent, with its wording'
    text: 'Consent questions are part of the form. The exact wording a person agreed to is kept with their registration.'
  covered:
    title: 'Only what you describe'
    text: 'If a form asks for sensitive details, such as health information, that your privacy information does not mention, registration pauses until the two match.'
  remind:
    title: 'Reminders before deadlines'
    text: 'Deletion deadlines follow the retention periods you published. Your team is reminded before they are due.'
  delete:
    title: 'Deletion on your decision'
    text: 'Delete sensitive details first and all registrations later, each recorded with its date. Nothing is deleted without someone on your team choosing to.'
note: '@:app_name provides the structure and the tools. What you collect, why, and for how long remains your organisation’s decision and responsibility.'
policy_link: 'Privacy policy of this platform'
</i18n>

<i18n lang="yaml" locale="de">
eyebrow: 'Datenschutz von Anfang an'
title: 'Teilnehmerdaten mit Sorgfalt behandelt'
subtitle: 'Von der ersten Frage bis zur endgültigen Löschung gibt @:app_name deiner Organisation eine klare Struktur für den Umgang mit Anmeldedaten. So geht es mit ihnen weiter.'
stage:
  inform:
    title: 'Zuerst die Information'
    text: 'Deine Organisation beschreibt, was sie erhebt und wozu, und jede Veranstaltung ergänzt, was für sie besonders ist. Anmeldende finden es unter einem dauerhaften Link, auch in ihrer Bestätigungsmail.'
  consent:
    title: 'Einwilligung samt Wortlaut'
    text: 'Einwilligungsfragen sind Teil des Formulars. Der genaue Wortlaut, dem jemand zugestimmt hat, wird mit der Anmeldung aufbewahrt.'
  covered:
    title: 'Nur, was du beschreibst'
    text: 'Fragt ein Formular nach sensiblen Angaben wie Gesundheitsdaten, die deine Datenschutzinformationen nicht nennen, pausieren die Anmeldungen, bis beides zusammenpasst.'
  remind:
    title: 'Erinnerung vor Fristen'
    text: 'Löschfristen richten sich nach den Speicherdauern, die du veröffentlicht hast. Dein Team wird erinnert, bevor sie fällig werden.'
  delete:
    title: 'Löschen, wenn du entscheidest'
    text: 'Erst sensible Angaben, später alle Anmeldungen löschen, jeweils mit Datum festgehalten. Gelöscht wird nichts, ohne dass jemand aus deinem Team es auslöst.'
note: '@:app_name stellt die Struktur und die Werkzeuge bereit. Was ihr erhebt, wozu und wie lange, bleibt die Entscheidung und Verantwortung deiner Organisation.'
policy_link: 'Datenschutzerklärung dieser Plattform'
</i18n>

<i18n lang="yaml" locale="fr">
eyebrow: 'Confidentialité dès la conception'
title: 'Les données des participants, traitées avec soin'
subtitle: 'De la première question à la suppression définitive, @:app_name donne à votre organisation un cadre clair pour les données d’inscription. Voici ce qu’elles deviennent en chemin.'
stage:
  inform:
    title: 'D’abord l’information'
    text: 'Votre organisation décrit ce qu’elle collecte et pourquoi, et chaque événement ajoute ce qui lui est propre. Les inscrits la trouvent à un lien permanent, aussi dans leur e-mail de confirmation.'
  consent:
    title: 'Le consentement, avec son texte'
    text: 'Les questions de consentement font partie du formulaire. Le texte exact accepté par chaque personne est conservé avec son inscription.'
  covered:
    title: 'Seulement ce que vous décrivez'
    text: 'Si un formulaire demande des informations sensibles, comme des données de santé, que vos informations de confidentialité ne mentionnent pas, les inscriptions sont suspendues jusqu’à ce que les deux concordent.'
  remind:
    title: 'Des rappels avant les échéances'
    text: 'Les échéances de suppression suivent les durées de conservation que vous avez publiées. Votre équipe reçoit un rappel avant leur terme.'
  delete:
    title: 'Supprimer, sur votre décision'
    text: 'Supprimez d’abord les informations sensibles, plus tard toutes les inscriptions, chaque fois avec sa date. Rien n’est supprimé sans qu’un membre de votre équipe le décide.'
note: '@:app_name fournit le cadre et les outils. Ce que vous collectez, pourquoi et pour combien de temps reste la décision et la responsabilité de votre organisation.'
policy_link: 'Politique de confidentialité de cette plateforme'
</i18n>

<i18n lang="yaml" locale="pl">
eyebrow: 'Prywatność od początku'
title: 'Dane uczestników traktowane z troską'
subtitle: 'Od pierwszego pytania aż po ostateczne usunięcie @:app_name daje twojej organizacji przejrzystą strukturę obchodzenia się z danymi zgłoszeń. Oto, co dzieje się z nimi po drodze.'
stage:
  inform:
    title: 'Najpierw informacja'
    text: 'Twoja organizacja opisuje, co zbiera i w jakim celu, a każde wydarzenie dodaje to, co dotyczy tylko jego. Zgłaszający znajdą to pod stałym linkiem, także w e-mailu z potwierdzeniem.'
  consent:
    title: 'Zgoda razem z jej treścią'
    text: 'Pytania o zgodę są częścią formularza. Dokładna treść, na którą ktoś się zgodził, jest przechowywana razem z jego zgłoszeniem.'
  covered:
    title: 'Tylko to, co opisujesz'
    text: 'Jeśli formularz pyta o dane wrażliwe, takie jak informacje o zdrowiu, których nie wymieniają twoje informacje o prywatności, zapisy są wstrzymane, dopóki jedno nie będzie zgodne z drugim.'
  remind:
    title: 'Przypomnienia przed terminami'
    text: 'Terminy usunięcia wynikają z opublikowanych przez ciebie okresów przechowywania. Twój zespół dostaje przypomnienie, zanim nadejdą.'
  delete:
    title: 'Usuwanie z twojej decyzji'
    text: 'Najpierw usuń dane wrażliwe, później wszystkie zgłoszenia, za każdym razem z zapisaną datą. Nic nie zostaje usunięte, dopóki ktoś z twojego zespołu tego nie zdecyduje.'
note: '@:app_name zapewnia strukturę i narzędzia. To, co zbierasz, w jakim celu i jak długo, pozostaje decyzją i odpowiedzialnością twojej organizacji.'
policy_link: 'Polityka prywatności tej platformy'
</i18n>

<i18n lang="yaml" locale="cs">
eyebrow: 'Soukromí od začátku'
title: 'S údaji účastníků zacházíme pečlivě'
subtitle: 'Od první otázky až po konečné smazání dává @:app_name vaší organizaci jasnou strukturu pro práci s údaji z přihlášek. Takto s nimi postupně naloží.'
stage:
  inform:
    title: 'Nejdřív informace'
    text: 'Vaše organizace popíše, co shromažďuje a proč, a každá akce doplní, co se týká jen jí. Přihlášení to najdou na trvalém odkazu, také v potvrzovacím e-mailu.'
  consent:
    title: 'Souhlas i s jeho zněním'
    text: 'Otázky na souhlas jsou součástí formuláře. Přesné znění, se kterým člověk souhlasil, se uchová u jeho přihlášky.'
  covered:
    title: 'Jen to, co popíšete'
    text: 'Pokud se formulář ptá na citlivé údaje, například zdravotní, které vaše informace o ochraně osobních údajů neuvádějí, přihlašování se pozastaví, dokud nebude obojí v souladu.'
  remind:
    title: 'Připomenutí před lhůtami'
    text: 'Lhůty pro smazání se řídí dobami uchování, které jste zveřejnili. Váš tým dostane připomenutí, než nastanou.'
  delete:
    title: 'Mazání podle vašeho rozhodnutí'
    text: 'Nejdřív smažte citlivé údaje, později všechny přihlášky, pokaždé se zaznamenaným datem. Nic se nesmaže, dokud o tom někdo z vašeho týmu nerozhodne.'
note: '@:app_name poskytuje strukturu a nástroje. Co shromažďujete, proč a jak dlouho, zůstává rozhodnutím a odpovědností vaší organizace.'
policy_link: 'Zásady ochrany osobních údajů této platformy'
</i18n>

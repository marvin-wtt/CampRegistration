<template>
  <div class="privacy-notice">
    <section>
      <h2>{{ t('section.controller') }}</h2>
      <p>
        {{ notice.controller.name }}<br />
        {{ notice.controller.addressStreet }}<br />
        {{ notice.controller.addressZipCode }} {{ notice.controller.addressCity
        }}<br />
        {{ countryName }}
      </p>
      <p>
        <template v-if="notice.controller.registrationNumber">
          {{ t('registrationNumber') }}:
          {{ notice.controller.registrationNumber }}<br />
        </template>
        {{ t('email') }}:
        <a :href="`mailto:${notice.controller.contactEmail}`">
          {{ notice.controller.contactEmail }}
        </a>
        <template v-if="notice.controller.phone">
          <br />{{ t('phone') }}: {{ notice.controller.phone }}
        </template>
      </p>
    </section>

    <p
      v-if="noticeMissing"
      class="privacy-notice__missing"
    >
      {{ t('noticeMissing') }}
    </p>

    <!-- The organization wrote its own prose; there is no structure to render. -->
    <section v-else-if="freeTextHtml">
      <!-- eslint-disable-next-line vue/no-v-html -- sanitized above and on write -->
      <div
        class="privacy-notice__prose"
        v-html="freeTextHtml"
      />
    </section>

    <template v-else-if="builderNotice">
      <section v-if="builderNotice.dataCategories.length">
        <h2>{{ t('section.dataCategories') }}</h2>
        <ul>
          <li
            v-for="category in builderNotice.dataCategories"
            :key="category.key"
          >
            {{ categoryLabel(category) }}
            <span
              v-if="category.specialCategoryBasis"
              class="privacy-notice__basis"
            >
              —
              {{
                gt(
                  `privacy.specialCategoryBasis.${category.specialCategoryBasis}`,
                )
              }}
            </span>
          </li>
        </ul>
      </section>

      <section v-if="builderNotice.purposes.length">
        <h2>{{ t('section.purposes') }}</h2>
        <ul>
          <li
            v-for="purpose in builderNotice.purposes"
            :key="purpose.key"
          >
            {{ purposeLabel(purpose) }}
            <span class="privacy-notice__basis">
              — {{ gt(`privacy.legalBasis.${purpose.legalBasis}`) }}
            </span>
            <template v-if="purpose.legitimateInterest">
              <br />
              <span class="privacy-notice__interest">
                {{ t('legitimateInterest') }}:
                {{ to(purpose.legitimateInterest) }}
              </span>
            </template>
          </li>
        </ul>
      </section>

      <section v-if="builderNotice.recipients.length">
        <h2>{{ t('section.recipients') }}</h2>
        <ul>
          <li
            v-for="recipient in builderNotice.recipients"
            :key="recipient.key"
          >
            {{ gt(`privacy.recipient.${recipient.key}`) }}
            <template v-if="recipient.name"> ({{ recipient.name }}) </template>
          </li>
        </ul>
      </section>

      <section v-if="builderNotice.retention">
        <h2>{{ t('section.retention') }}</h2>
        <p>
          {{
            t('retentionSentence', {
              months: builderNotice.retention.months,
              anchor: gt(
                `privacy.retentionAnchor.${builderNotice.retention.anchor}`,
              ),
            })
          }}
        </p>
        <template v-if="exceptions.length">
          <p>{{ t('retentionExceptionsIntro') }}</p>
          <ul>
            <li
              v-for="(exception, index) in exceptions"
              :key="`${exception.scope}-${index}`"
            >
              {{ exceptionLabel(exception) }} —
              <!-- Nothing counts down here, so there is no period to state:
                   what ends it is the withdrawal. -->
              <template v-if="isConsentBoundException(exception)">
                {{ gt('privacy.retentionUntil.consent_withdrawn') }}
              </template>
              <template v-else>
                {{
                  t('retentionSentenceShort', {
                    months: exception.months,
                    anchor: gt(`privacy.retentionAnchor.${exception.anchor}`),
                  })
                }}
              </template>
              <template v-if="exception.reason">
                ({{ to(exception.reason) }})
              </template>
            </li>
          </ul>
          <!-- Art. 7(3): the withdrawal is what ends the storage, so the notice
               has to say plainly that withdrawing is what erases it. How to
               withdraw is in the rights section below. -->
          <p v-if="hasConsentBoundException">
            {{ gt('privacy.retentionConsentSentence') }}
          </p>
        </template>
        <!-- A statutory retention duty overrides the period the controller
             picked, so the period above cannot be stated as the whole answer. -->
        <p>{{ t('retentionLegalNote') }}</p>
      </section>

      <section v-if="builderNotice.thirdCountryTransfers.enabled">
        <h2>{{ t('section.transfers') }}</h2>
        <p>
          {{
            t('transferSentence', {
              countries: transferCountries,
              safeguard: builderNotice.thirdCountryTransfers.safeguard
                ? gt(
                    `privacy.transferSafeguard.${builderNotice.thirdCountryTransfers.safeguard}`,
                  )
                : '',
            })
          }}
        </p>
        <p v-if="transferNote">{{ transferNote }}</p>
      </section>

      <section v-if="builderNotice.dpo">
        <h2>{{ t('section.dpo') }}</h2>
        <p>
          {{ builderNotice.dpo.name }}<br />
          {{ t('email') }}:
          <a :href="`mailto:${builderNotice.dpo.email}`">
            {{ builderNotice.dpo.email }}
          </a>
        </p>
      </section>

      <section>
        <h2>{{ t('section.automated') }}</h2>
        <p>
          {{
            builderNotice.automatedDecisionMaking
              ? t('automatedYes')
              : t('automatedNo')
          }}
        </p>
        <p v-if="automatedDetails">{{ automatedDetails }}</p>
      </section>

      <section v-if="additionalHtml">
        <h2>{{ t('section.additional') }}</h2>
        <!-- eslint-disable-next-line vue/no-v-html -- sanitized above and on write -->
        <div
          class="privacy-notice__prose"
          v-html="additionalHtml"
        />
      </section>
    </template>

    <!-- Outside the mode branch: a event's addition applies whether its
         organization used the builder or wrote its own prose. -->
    <section v-if="eventAdditionalHtml">
      <h2>{{ t('section.eventAdditional') }}</h2>
      <!-- eslint-disable-next-line vue/no-v-html -- sanitized above and on write -->
      <div
        class="privacy-notice__prose"
        v-html="eventAdditionalHtml"
      />
    </section>

    <!-- Unconditional: it describes how the registration form behaves, which is
         the same for every organization and every event, so nothing about it is
         the controller's to configure. -->
    <section>
      <h2>{{ t('section.dataProvision') }}</h2>
      <p>{{ t('dataProvision') }}</p>
    </section>

    <!-- Fixed by law and identical for every organization, so it is generated
         rather than authored — see common/src/privacy. -->
    <section>
      <h2>{{ t('section.rights') }}</h2>
      <ul>
        <li>{{ t('rights.access') }}</li>
        <li>{{ t('rights.rectification') }}</li>
        <li>{{ t('rights.erasure') }}</li>
        <li>{{ t('rights.restriction') }}</li>
        <li>{{ t('rights.portability') }}</li>
        <li>{{ t('rights.object') }}</li>
        <li>{{ t('rights.withdrawConsent') }}</li>
      </ul>
      <!-- Neither right is unconditional, and Art. 13(2)(b)/(c) require saying
           so: on which basis each one applies, and what exercising it does. -->
      <p>{{ t('rights.objectNote') }}</p>
      <p>{{ t('rights.withdrawConsentNote') }}</p>
      <p>{{ t('rights.howTo', { email: notice.controller.contactEmail }) }}</p>
    </section>

    <section>
      <h2>{{ t('section.complaint') }}</h2>
      <p>{{ t('complaint') }}</p>
      <p v-if="notice.supervisoryAuthority">
        {{ notice.supervisoryAuthority.name }}<br />
        <a
          :href="notice.supervisoryAuthority.website"
          target="_blank"
          rel="noopener"
        >
          {{ notice.supervisoryAuthority.website }}
        </a>
      </p>
      <p v-if="notice.supervisoryAuthority?.regional">
        {{ t('regionalAuthority') }}
      </p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DOMPurify from 'dompurify';
import {
  isConsentBoundException,
  retentionExceptions,
  type PublishedPrivacyNotice,
} from '@camp-registration/common/privacy';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePrivacyLabels } from '@/composables/privacyLabels';

const props = defineProps<{
  notice: PublishedPrivacyNotice;
}>();

const { t } = useI18n();
// The catalogue vocabulary and country names are global
const { t: gt } = useI18n({ useScope: 'global' });
const { to } = useObjectTranslation();
const { categoryLabel, purposeLabel, exceptionLabel, countryLabel } =
  usePrivacyLabels();

const countryName = computed<string>(() =>
  countryLabel(props.notice.controller.country),
);

const freeTextHtml = computed<string | null>(() =>
  props.notice.notice?.mode === 'free_text'
    ? sanitized(props.notice.notice.freeText)
    : null,
);

const noticeMissing = computed<boolean>(
  () =>
    !props.notice.notice ||
    (props.notice.notice.mode === 'free_text' && !freeTextHtml.value),
);

const builderNotice = computed(() =>
  props.notice.notice?.mode === 'builder' ? props.notice.notice : null,
);

// Both sit *under* a generated section heading, so the editor's own top level
// (h2, the level a free-text notice writes its sections at) has to move down a
// step to stay a subheading of it rather than outranking it.
const additionalHtml = computed<string | null>(() =>
  props.notice.notice
    ? demoteHeadings(sanitized(props.notice.notice.additional))
    : null,
);

const eventAdditionalHtml = computed<string | null>(() =>
  props.notice.notice
    ? demoteHeadings(sanitized(props.notice.notice.eventAdditional))
    : null,
);

const exceptions = computed(() =>
  retentionExceptions(props.notice.notice?.retention),
);

const hasConsentBoundException = computed<boolean>(() =>
  exceptions.value.some(isConsentBoundException),
);

const automatedDetails = computed<string | null>(() =>
  props.notice.notice?.automatedDecisionMakingDetails
    ? to(props.notice.notice.automatedDecisionMakingDetails)
    : null,
);

const transferNote = computed<string | null>(() =>
  props.notice.notice?.thirdCountryTransfers.note
    ? to(props.notice.notice.thirdCountryTransfers.note)
    : null,
);

const transferCountries = computed<string>(() =>
  (props.notice.notice?.thirdCountryTransfers.countries ?? [])
    .map(countryLabel)
    .join(', '),
);

// h3 first: rewriting h2 first would demote the result a second time.
function demoteHeadings(html: string | null): string | null {
  return (
    html
      ?.replace(/<(\/?)h3(\s|>)/gi, '<$1h4$2')
      .replace(/<(\/?)h2(\s|>)/gi, '<$1h3$2') ?? null
  );
}

function sanitized(value: unknown): string | null {
  const html = to(value as never);

  return html ? DOMPurify.sanitize(html) : null;
}
</script>

<style lang="scss" scoped>
.privacy-notice {
  color: var(--md3-on-surface);

  section {
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.1rem;
    line-height: 1.4;
    margin: 0 0 0.5rem;
    color: var(--md3-on-surface);
  }

  p,
  ul {
    margin: 0 0 0.5rem;
  }

  ul {
    padding-left: 1.25rem;
  }

  a {
    color: var(--md3-primary);
  }

  /* Authored HTML, so it is out of reach of the scoped rules above and would
     otherwise fall back to the browser's own scale — where an h2 written in
     the editor renders larger than the section heading it sits under. */
  &__prose {
    :deep(h2) {
      font-size: 1.1rem;
      line-height: 1.4;
      margin: 0 0 0.5rem;
      color: var(--md3-on-surface);
    }

    :deep(h3) {
      font-size: 1rem;
      line-height: 1.4;
      margin: 1rem 0 0.25rem;
      color: var(--md3-on-surface);
    }

    :deep(h4) {
      font-size: 0.9375rem;
      line-height: 1.4;
      margin: 0.75rem 0 0.25rem;
      color: var(--md3-on-surface);
    }

    :deep(p),
    :deep(ul),
    :deep(ol) {
      margin: 0 0 0.5rem;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 1.25rem;
    }

    :deep(a) {
      color: var(--md3-primary);
    }
  }

  &__basis,
  &__interest {
    color: var(--md3-on-surface-variant);
  }

  &__missing {
    color: var(--md3-error);
  }
}
</style>

<i18n lang="yaml" locale="en">
section:
  controller: 'Who is responsible for your data'
  dataCategories: 'What we collect'
  purposes: 'Why we use it, and on what legal basis'
  recipients: 'Who else receives it'
  retention: 'How long we keep it'
  transfers: 'Transfers outside the EEA'
  dpo: 'Data protection officer'
  dataProvision: 'Whether you have to provide this data'
  automated: 'Automated decision-making'
  additional: 'Further information'
  eventAdditional: 'Additional information for this event'
  rights: 'Your rights'
  complaint: 'Right to complain'
registrationNumber: 'Registration number'
email: 'Email'
phone: 'Phone'
legitimateInterest: 'Our legitimate interest'
retentionSentence: 'We keep your data for {months} months {anchor}.'
retentionExceptionsIntro: 'Some of it we keep longer:'
retentionSentenceShort: '{months} months {anchor}'
retentionLegalNote: 'Where the law requires data to be kept for longer — under tax, accounting or insurance rules, for example — we keep it for as long as that obligation lasts, even once the period above has passed.'
transferSentence: 'Your data is transferred to {countries}, on the basis of {safeguard}.'
automatedYes: 'We use automated decision-making, including profiling, in the course of this processing.'
automatedNo: 'We do not use automated decision-making or profiling.'
dataProvision: 'Fields marked as required have to be filled in before the registration can be submitted; without them we cannot process it. All other fields are voluntary: leaving one blank does not affect whether your registration is accepted, but it does mean we cannot take that information into account — a dietary requirement or a medical condition we do not know about is one we cannot cater for.'
noticeMissing: 'This organisation has not yet published privacy information for its events.'
regionalAuthority: 'Depending on where the organisation is established, a regional supervisory authority may be competent instead.'
complaint: 'You have the right to lodge a complaint with a data protection supervisory authority.'
rights:
  access: 'Access to your data (Art. 15 GDPR)'
  rectification: 'Correction of inaccurate data (Art. 16 GDPR)'
  erasure: 'Erasure of your data (Art. 17 GDPR)'
  restriction: 'Restriction of processing (Art. 18 GDPR)'
  portability: 'Data portability (Art. 20 GDPR)'
  object: 'Objection to processing (Art. 21 GDPR)'
  objectNote: 'The right to object applies where we process data on the basis of our legitimate interests or of a public task. If you object, we stop processing that data unless we can show compelling legitimate grounds that override your interests, or we still need it to establish or defend legal claims.'
  withdrawConsent: 'Withdrawal of your consent, at any time and as easily as you gave it (Art. 7(3) GDPR)'
  withdrawConsentNote: 'The right to withdraw applies where we process data on the basis of your consent. Withdrawing it does not affect the lawfulness of the processing carried out beforehand.'
  howTo: 'To exercise any of these rights, contact {email}.'
</i18n>

<i18n lang="yaml" locale="de">
section:
  controller: 'Wer für deine Daten verantwortlich ist'
  dataCategories: 'Welche Daten wir erheben'
  purposes: 'Wozu wir sie nutzen und auf welcher Rechtsgrundlage'
  recipients: 'Wer sie außerdem erhält'
  retention: 'Wie lange wir sie speichern'
  transfers: 'Übermittlung außerhalb des EWR'
  dpo: 'Datenschutzbeauftragte Person'
  dataProvision: 'Ob die Daten bereitgestellt werden müssen'
  automated: 'Automatisierte Entscheidungsfindung'
  additional: 'Weitere Informationen'
  eventAdditional: 'Zusätzliche Informationen zu dieser Veranstaltung'
  rights: 'Deine Rechte'
  complaint: 'Beschwerderecht'
registrationNumber: 'Registernummer'
email: 'E-Mail'
phone: 'Telefon'
legitimateInterest: 'Unser berechtigtes Interesse'
retentionSentence: 'Wir speichern deine Daten {months} Monate {anchor}.'
retentionExceptionsIntro: 'Einiges davon speichern wir länger:'
retentionSentenceShort: '{months} Monate {anchor}'
retentionLegalNote: 'Müssen Daten aufgrund gesetzlicher Vorgaben länger aufbewahrt werden – etwa nach steuer-, handels- oder versicherungsrechtlichen Vorschriften –, speichern wir sie so lange, wie diese Pflicht besteht, auch über den oben genannten Zeitraum hinaus.'
transferSentence: 'Deine Daten werden nach {countries} übermittelt, gestützt auf {safeguard}.'
automatedYes: 'Im Rahmen dieser Verarbeitung findet eine automatisierte Entscheidungsfindung einschließlich Profiling statt.'
automatedNo: 'Eine automatisierte Entscheidungsfindung oder ein Profiling findet nicht statt.'
dataProvision: 'Als Pflichtfeld gekennzeichnete Angaben müssen ausgefüllt werden, bevor die Anmeldung abgeschickt werden kann; ohne sie können wir sie nicht bearbeiten. Alle übrigen Angaben sind freiwillig: Bleiben sie leer, hat das keinen Einfluss darauf, ob deine Anmeldung angenommen wird. Wir können sie dann aber auch nicht berücksichtigen – eine Ernährungsweise oder eine Erkrankung, von der wir nichts wissen, können wir nicht einplanen.'
noticeMissing: 'Diese Organisation hat noch keine Datenschutzinformationen für ihre Veranstaltungen veröffentlicht.'
regionalAuthority: 'Je nach Sitz der Organisation kann stattdessen eine Landesdatenschutzbehörde zuständig sein.'
complaint: 'Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren.'
rights:
  access: 'Auskunft über deine Daten (Art. 15 DSGVO)'
  rectification: 'Berichtigung unrichtiger Daten (Art. 16 DSGVO)'
  erasure: 'Löschung deiner Daten (Art. 17 DSGVO)'
  restriction: 'Einschränkung der Verarbeitung (Art. 18 DSGVO)'
  portability: 'Datenübertragbarkeit (Art. 20 DSGVO)'
  object: 'Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)'
  objectNote: 'Das Widerspruchsrecht besteht, soweit wir Daten auf Grundlage unseres berechtigten Interesses oder einer im öffentlichen Interesse liegenden Aufgabe verarbeiten. Widersprichst du, verarbeiten wir diese Daten nicht weiter – es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die deine Interessen überwiegen, oder wir benötigen sie zur Geltendmachung oder Verteidigung von Rechtsansprüchen.'
  withdrawConsent: 'Widerruf deiner Einwilligung, jederzeit und so einfach wie die Erteilung (Art. 7 Abs. 3 DSGVO)'
  withdrawConsentNote: 'Das Widerrufsrecht besteht, soweit wir Daten auf Grundlage deiner Einwilligung verarbeiten. Der Widerruf berührt nicht die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung.'
  howTo: 'Wende dich zur Ausübung dieser Rechte an {email}.'
</i18n>

<i18n lang="yaml" locale="fr">
section:
  controller: 'Qui est responsable de vos données'
  dataCategories: 'Ce que nous collectons'
  purposes: 'Pourquoi nous les utilisons, et sur quelle base légale'
  recipients: 'Qui les reçoit également'
  retention: 'Combien de temps nous les conservons'
  transfers: "Transferts en dehors de l'EEE"
  dpo: 'Délégué à la protection des données'
  dataProvision: 'Êtes-vous tenu de fournir ces données ?'
  automated: 'Décision automatisée'
  additional: 'Informations complémentaires'
  eventAdditional: 'Informations complémentaires pour cet événement'
  rights: 'Vos droits'
  complaint: 'Droit de réclamation'
registrationNumber: "Numéro d'enregistrement"
email: 'E-mail'
phone: 'Téléphone'
legitimateInterest: 'Notre intérêt légitime'
retentionSentence: 'Nous conservons vos données pendant {months} mois {anchor}.'
retentionExceptionsIntro: 'Certaines données sont conservées plus longtemps :'
retentionSentenceShort: '{months} mois {anchor}'
retentionLegalNote: "Lorsque la loi impose une conservation plus longue — en matière fiscale, comptable ou d'assurance, par exemple —, nous conservons les données aussi longtemps que dure cette obligation, même une fois la durée indiquée ci-dessus écoulée."
transferSentence: 'Vos données sont transférées vers {countries}, sur la base de {safeguard}.'
automatedYes: 'Ce traitement comporte une prise de décision automatisée, y compris un profilage.'
automatedNo: "Nous n'avons recours ni à la décision automatisée ni au profilage."
dataProvision: "Les champs signalés comme obligatoires doivent être remplis pour que l'inscription puisse être envoyée ; sans eux, nous ne pouvons pas la traiter. Tous les autres champs sont facultatifs : les laisser vides n'a aucune incidence sur l'acceptation de votre inscription, mais nous ne pourrons pas en tenir compte — un régime alimentaire ou un problème de santé que nous ignorons ne peut pas être pris en charge."
noticeMissing: "Cette organisation n'a pas encore publié d'informations relatives à la protection des données pour ses événements."
regionalAuthority: "Selon le lieu d'établissement de l'organisation, une autorité de contrôle régionale peut être compétente."
complaint: "Vous avez le droit d'introduire une réclamation auprès d'une autorité de contrôle en matière de protection des données."
rights:
  access: 'Accès à vos données (art. 15 RGPD)'
  rectification: 'Rectification des données inexactes (art. 16 RGPD)'
  erasure: 'Effacement de vos données (art. 17 RGPD)'
  restriction: 'Limitation du traitement (art. 18 RGPD)'
  portability: 'Portabilité des données (art. 20 RGPD)'
  object: 'Opposition au traitement (art. 21 RGPD)'
  objectNote: "Le droit d'opposition s'applique lorsque nous traitons des données sur la base de notre intérêt légitime ou d'une mission d'intérêt public. Si vous vous y opposez, nous cessons de traiter ces données, sauf si nous pouvons démontrer des motifs légitimes impérieux qui prévalent sur vos intérêts, ou si elles nous restent nécessaires pour constater ou défendre des droits en justice."
  withdrawConsent: "Retrait de votre consentement, à tout moment et aussi simplement que vous l'avez donné (art. 7, § 3, RGPD)"
  withdrawConsentNote: "Le droit de retrait s'applique lorsque nous traitons des données sur la base de votre consentement. Le retrait ne remet pas en cause la licéité du traitement effectué auparavant."
  howTo: 'Pour exercer ces droits, contactez {email}.'
</i18n>

<i18n lang="yaml" locale="cs">
section:
  controller: 'Kdo odpovídá za tvoje údaje'
  dataCategories: 'Jaké údaje shromažďujeme'
  purposes: 'K čemu je používáme a na jakém právním základě'
  recipients: 'Kdo je dále dostává'
  retention: 'Jak dlouho je uchováváme'
  transfers: 'Předávání mimo EHP'
  dpo: 'Pověřenec pro ochranu osobních údajů'
  dataProvision: 'Zda je nutné údaje poskytnout'
  automated: 'Automatizované rozhodování'
  additional: 'Další informace'
  eventAdditional: 'Doplňující informace k této akci'
  rights: 'Tvoje práva'
  complaint: 'Právo podat stížnost'
registrationNumber: 'Registrační číslo'
email: 'E-mail'
phone: 'Telefon'
legitimateInterest: 'Náš oprávněný zájem'
retentionSentence: 'Tvoje údaje uchováváme {months} měsíců {anchor}.'
retentionExceptionsIntro: 'Něco z toho uchováváme déle:'
retentionSentenceShort: '{months} měsíců {anchor}'
retentionLegalNote: 'Pokud musíme údaje uchovávat déle na základě zákona – například podle daňových, účetních nebo pojistných předpisů –, uchováváme je po celou dobu trvání této povinnosti, i po uplynutí výše uvedené lhůty.'
transferSentence: 'Tvoje údaje jsou předávány do {countries} na základě {safeguard}.'
automatedYes: 'V rámci tohoto zpracování dochází k automatizovanému rozhodování včetně profilování.'
automatedNo: 'K automatizovanému rozhodování ani profilování nedochází.'
dataProvision: 'Pole označená jako povinná je nutné vyplnit, aby šlo přihlášku odeslat; bez nich ji nemůžeme zpracovat. Všechna ostatní pole jsou dobrovolná: pokud je necháš prázdná, nemá to vliv na to, zda přihlášku přijmeme. Nemůžeme k nim ale přihlédnout – na stravovací potřebu nebo zdravotní obtíž, o které nevíme, se nedokážeme připravit.'
noticeMissing: 'Tato organizace zatím nezveřejnila informace o ochraně osobních údajů pro své akce.'
regionalAuthority: 'Podle sídla organizace může být příslušný jiný, regionální dozorový úřad.'
complaint: 'Máš právo podat stížnost u dozorového úřadu pro ochranu osobních údajů.'
rights:
  access: 'Přístup k tvým údajům (čl. 15 GDPR)'
  rectification: 'Oprava nepřesných údajů (čl. 16 GDPR)'
  erasure: 'Výmaz tvých údajů (čl. 17 GDPR)'
  restriction: 'Omezení zpracování (čl. 18 GDPR)'
  portability: 'Přenositelnost údajů (čl. 20 GDPR)'
  object: 'Námitka proti zpracování (čl. 21 GDPR)'
  objectNote: 'Právo vznést námitku máš tam, kde údaje zpracováváme na základě našeho oprávněného zájmu nebo úkolu ve veřejném zájmu. Pokud námitku vzneseš, tyto údaje dál nezpracováváme – ledaže prokážeme závažné oprávněné důvody, které převažují nad tvými zájmy, nebo je potřebujeme pro určení či obhajobu právních nároků.'
  withdrawConsent: 'Odvolání tvého souhlasu, kdykoli a stejně snadno, jako byl udělen (čl. 7 odst. 3 GDPR)'
  withdrawConsentNote: 'Právo souhlas odvolat máš tam, kde údaje zpracováváme na základě tvého souhlasu. Odvoláním není dotčena zákonnost zpracování provedeného do té doby.'
  howTo: 'Pro uplatnění těchto práv kontaktuj {email}.'
</i18n>

<i18n lang="yaml" locale="pl">
section:
  controller: 'Kto odpowiada za Twoje dane'
  dataCategories: 'Jakie dane zbieramy'
  purposes: 'W jakim celu i na jakiej podstawie prawnej'
  recipients: 'Kto jeszcze je otrzymuje'
  retention: 'Jak długo je przechowujemy'
  transfers: 'Przekazywanie poza EOG'
  dpo: 'Inspektor ochrony danych'
  dataProvision: 'Czy trzeba podać te dane'
  automated: 'Zautomatyzowane podejmowanie decyzji'
  additional: 'Dodatkowe informacje'
  eventAdditional: 'Dodatkowe informacje dotyczące tego wydarzenia'
  rights: 'Twoje prawa'
  complaint: 'Prawo do skargi'
registrationNumber: 'Numer rejestrowy'
email: 'E-mail'
phone: 'Telefon'
legitimateInterest: 'Nasz prawnie uzasadniony interes'
retentionSentence: 'Przechowujemy Twoje dane przez {months} miesięcy {anchor}.'
retentionExceptionsIntro: 'Część z nich przechowujemy dłużej:'
retentionSentenceShort: '{months} miesięcy {anchor}'
retentionLegalNote: 'Jeżeli przepisy wymagają dłuższego przechowywania — na przykład podatkowe, rachunkowe lub ubezpieczeniowe — przechowujemy dane tak długo, jak trwa ten obowiązek, także po upływie wskazanego wyżej okresu.'
transferSentence: 'Twoje dane są przekazywane do {countries} na podstawie {safeguard}.'
automatedYes: 'W ramach tego przetwarzania dochodzi do zautomatyzowanego podejmowania decyzji, w tym profilowania.'
automatedNo: 'Nie stosujemy zautomatyzowanego podejmowania decyzji ani profilowania.'
dataProvision: 'Pola oznaczone jako obowiązkowe trzeba wypełnić, aby wysłać zgłoszenie; bez nich nie możemy go rozpatrzyć. Wszystkie pozostałe pola są dobrowolne: pozostawienie ich pustymi nie wpływa na to, czy przyjmiemy zgłoszenie, ale nie będziemy mogli tych informacji uwzględnić — nie zadbamy o dietę ani o dolegliwość, o której nie wiemy.'
noticeMissing: 'Ta organizacja nie opublikowała jeszcze informacji o ochronie danych dla swoich wydarzeń.'
regionalAuthority: 'W zależności od siedziby organizacji właściwy może być regionalny organ nadzorczy.'
complaint: 'Masz prawo wnieść skargę do organu nadzorczego ds. ochrony danych.'
rights:
  access: 'Dostęp do Twoich danych (art. 15 RODO)'
  rectification: 'Sprostowanie nieprawidłowych danych (art. 16 RODO)'
  erasure: 'Usunięcie Twoich danych (art. 17 RODO)'
  restriction: 'Ograniczenie przetwarzania (art. 18 RODO)'
  portability: 'Przenoszenie danych (art. 20 RODO)'
  object: 'Sprzeciw wobec przetwarzania (art. 21 RODO)'
  objectNote: 'Prawo do sprzeciwu przysługuje tam, gdzie przetwarzamy dane na podstawie naszego prawnie uzasadnionego interesu lub zadania realizowanego w interesie publicznym. Jeżeli wniesiesz sprzeciw, przestajemy przetwarzać te dane — chyba że wykażemy ważne prawnie uzasadnione podstawy nadrzędne wobec Twoich interesów lub dane są nam potrzebne do ustalenia lub obrony roszczeń.'
  withdrawConsent: 'Wycofanie Twojej zgody w dowolnym momencie, równie łatwo jak jej udzielenie (art. 7 ust. 3 RODO)'
  withdrawConsentNote: 'Prawo do wycofania zgody przysługuje tam, gdzie przetwarzamy dane na podstawie Twojej zgody. Wycofanie nie wpływa na zgodność z prawem przetwarzania dokonanego wcześniej.'
  howTo: 'Aby skorzystać z tych praw, skontaktuj się: {email}.'
</i18n>

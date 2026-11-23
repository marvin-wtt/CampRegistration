import type { Translatable } from '../entities/Translatable.js';
import type { LegalBasisKey, SpecialCategoryBasisKey } from './catalogue.js';
import type { DataProtectionFramework } from './content.js';

/**
 * The provisions the notice and its editors cite. Translations carry the
 * wording only; the citation comes from the record of the notice's law
 * (docs/privacy.md, 4), so another law is a record, not a copy of every string.
 */
export const CITED_RIGHTS = [
  'access',
  'rectification',
  'erasure',
  'restriction',
  'portability',
  'object',
] as const;
export type CitedRight = (typeof CITED_RIGHTS)[number];

export type CitationKey =
  | `legalBasis.${LegalBasisKey}`
  | `specialCategoryBasis.${SpecialCategoryBasisKey}`
  | `right.${CitedRight}`
  /** Special categories as such (GDPR Art. 9). */
  | 'specialCategories'
  /** Withdrawing consent (GDPR Art. 7(3)). */
  | 'withdrawal'
  /** Consent freely given, no tying (GDPR Art. 7(4)). */
  | 'freelyGiven'
  /** Information on automated decision-making (GDPR Art. 13(2)(f)). */
  | 'automatedInformation'
  /** Transfers on a derogation (GDPR Art. 49). */
  | 'transferDerogation';

/**
 * Catalogue wording a law phrases differently — its own grounds, not just
 * other numbers. Keyed like the global `privacy.*` translations they replace.
 */
export type FrameworkLabelKey =
  | `legalBasis.${LegalBasisKey}`
  | `specialCategoryBasis.${SpecialCategoryBasisKey}`
  | `specialCategoryCondition.${SpecialCategoryBasisKey}`;

export interface FrameworkRecord {
  framework: DataProtectionFramework;
  /** Changes whenever a citation does, so a published notice can keep its own. */
  version: string;
  /** Per locale where the law is cited differently per language. */
  citations: Record<CitationKey, Translatable>;
  /** The option label; absent where the translations name it (the GDPR). */
  name?: Translatable;
  /** The text cited, as an organizer can look it up; shown with the warning. */
  baseline?: Translatable;
  /**
   * Whether the platform names the supervisory authority (from the country)
   * or the organizer does. Church authorities follow the diocese or regional
   * church, which nothing the platform knows identifies.
   */
  authority: 'derived' | 'entered';
  /** Which authority is competent under this law, for the organizer. */
  authorityHint?: Translatable;
  labels?: Partial<Record<FrameworkLabelKey, Translatable>>;
  /**
   * Conditions this law adds to a basis, shown next to it in the editor. A
   * basis with one is never pre-selected (`presetLegalBasis`).
   */
  cautions?: Partial<Record<`legalBasis.${LegalBasisKey}`, Translatable>>;
}

/**
 * GDPR citations in each locale's own style — "Art. 6(1)(b) GDPR",
 * "Art. 6 Abs. 1 lit. b DSGVO", "art. 6, § 1, b, RGPD", … — as the
 * translations carried them before.
 */
function gdpr(articleNumber: number, paragraphNumber?: number, point?: string) {
  const article = String(articleNumber);
  const paragraph =
    paragraphNumber === undefined ? undefined : String(paragraphNumber);
  const at = (sep: string, pre = '') =>
    paragraph === undefined ? '' : `${sep}${pre}${paragraph}`;
  const pt = (pre: string, post = '') =>
    point === undefined ? '' : `${pre}${point}${post}`;

  return {
    en: `Art. ${article}${paragraph === undefined ? '' : `(${paragraph})`}${pt('(', ')')} GDPR`,
    de: `Art. ${article}${at(' ', 'Abs. ')}${pt(' lit. ')} DSGVO`,
    fr: `art. ${article}${at(', ', '§ ')}${pt(', ')}${paragraph === undefined ? ' ' : ', '}RGPD`,
    pl: `art. ${article}${at(' ', 'ust. ')}${pt(' lit. ')} RODO`,
    cs: `čl. ${article}${at(' ', 'odst. ')}${pt(' písm. ', ')')} GDPR`,
  };
}

export const GDPR_RECORD: FrameworkRecord = {
  framework: 'gdpr',
  version: 'gdpr-2016-679',
  authority: 'derived',
  citations: {
    'legalBasis.consent': gdpr(6, 1, 'a'),
    'legalBasis.contract': gdpr(6, 1, 'b'),
    'legalBasis.legal_obligation': gdpr(6, 1, 'c'),
    'legalBasis.vital_interests': gdpr(6, 1, 'd'),
    'legalBasis.public_task': gdpr(6, 1, 'e'),
    'legalBasis.legitimate_interests': gdpr(6, 1, 'f'),
    'specialCategoryBasis.explicit_consent': gdpr(9, 2, 'a'),
    'specialCategoryBasis.vital_interests': gdpr(9, 2, 'c'),
    'specialCategoryBasis.nonprofit_body': gdpr(9, 2, 'd'),
    'specialCategoryBasis.legal_claims': gdpr(9, 2, 'f'),
    'specialCategoryBasis.public_interest': gdpr(9, 2, 'g'),
    'specialCategoryBasis.health_care': gdpr(9, 2, 'h'),
    'right.access': gdpr(15),
    'right.rectification': gdpr(16),
    'right.erasure': gdpr(17),
    'right.restriction': gdpr(18),
    'right.portability': gdpr(20),
    'right.object': gdpr(21),
    specialCategories: gdpr(9),
    withdrawal: gdpr(7, 3),
    freelyGiven: gdpr(7, 4),
    automatedInformation: gdpr(13, 2, 'f'),
    transferDerogation: gdpr(49),
  },
};

// Church citations are German in every locale: the laws exist only in it.
const kdg = (provision: string): Translatable => `${provision} KDG`;
const dsgEkd = (provision: string): Translatable => `${provision} DSG-EKD`;

/** Both laws limit (d) to a church body, its members and regular contacts. */
const CHURCH_BODY_LABEL: Translatable = {
  en: 'Legitimate activities of a church body (members and regular contacts)',
  de: 'Rechtmäßige Tätigkeit einer kirchlichen Stelle (Mitglieder und regelmäßige Kontakte)',
  fr: 'Activités légitimes d’une entité ecclésiale (membres et contacts réguliers)',
  pl: 'Uprawniona działalność podmiotu kościelnego (członkowie i stałe kontakty)',
  cs: 'Oprávněná činnost církevního subjektu (členové a pravidelné kontakty)',
};

/**
 * Gesetz über den Kirchlichen Datenschutz, as decided by the Verband der
 * Diözesen Deutschlands on 20.11.2017 and amended on 24.11.2025 (reading
 * version). Each diocese enacts it in its own gazette; deviations are the
 * organizer's to check. Citations verified against that text
 * (docs/privacy.md, 4, "Verified citations").
 */
export const KDG_RECORD: FrameworkRecord = {
  framework: 'kdg',
  version: 'kdg-2025-11-24',
  name: 'KDG – Gesetz über den Kirchlichen Datenschutz',
  baseline: {
    en: 'model law of the Association of German Dioceses, as amended on 24.11.2025',
    de: 'Mustergesetz des Verbands der Diözesen Deutschlands in der Fassung vom 24.11.2025',
    fr: 'loi type de l’Association des diocèses d’Allemagne, modifiée le 24.11.2025',
    pl: 'ustawa wzorcowa Związku Diecezji Niemiec w brzmieniu z 24.11.2025',
    cs: 'vzorový zákon Svazu německých diecézí ve znění ze dne 24.11.2025',
  },
  authority: 'entered',
  authorityHint: {
    en: 'The data protection authority of the diocese in which your organisation’s legal entity has its seat (§ 45 KDG).',
    de: 'Die Datenschutzaufsicht der Diözese, in der der Rechtsträger deiner Organisation seinen Sitz hat (§ 45 KDG).',
    fr: 'L’autorité de protection des données du diocèse où l’entité juridique de votre organisation a son siège (§ 45 KDG).',
    pl: 'Organ ochrony danych diecezji, w której siedzibę ma podmiot prawny Twojej organizacji (§ 45 KDG).',
    cs: 'Dozorový úřad diecéze, v níž má právnická osoba tvé organizace sídlo (§ 45 KDG).',
  },
  citations: {
    'legalBasis.consent': kdg('§ 6 Abs. 1 lit. b'),
    'legalBasis.contract': kdg('§ 6 Abs. 1 lit. c'),
    'legalBasis.legal_obligation': kdg('§ 6 Abs. 1 lit. d'),
    'legalBasis.vital_interests': kdg('§ 6 Abs. 1 lit. e'),
    'legalBasis.public_task': kdg('§ 6 Abs. 1 lit. f'),
    'legalBasis.legitimate_interests': kdg('§ 6 Abs. 1 lit. g'),
    'specialCategoryBasis.explicit_consent': kdg('§ 11 Abs. 2 lit. a'),
    'specialCategoryBasis.vital_interests': kdg('§ 11 Abs. 2 lit. c'),
    'specialCategoryBasis.nonprofit_body': kdg('§ 11 Abs. 2 lit. d'),
    'specialCategoryBasis.legal_claims': kdg('§ 11 Abs. 2 lit. f'),
    'specialCategoryBasis.public_interest': kdg('§ 11 Abs. 2 lit. g'),
    'specialCategoryBasis.health_care': kdg('§ 11 Abs. 2 lit. h'),
    'right.access': kdg('§ 17'),
    'right.rectification': kdg('§ 18'),
    'right.erasure': kdg('§ 19'),
    'right.restriction': kdg('§ 20'),
    'right.portability': kdg('§ 22'),
    'right.object': kdg('§ 23'),
    specialCategories: kdg('§ 11'),
    withdrawal: kdg('§ 8 Abs. 4'),
    freelyGiven: kdg('§ 8 Abs. 5'),
    automatedInformation: kdg('§ 15 Abs. 2 lit. f'),
    transferDerogation: kdg('§ 41'),
  },
  labels: {
    'legalBasis.public_task': {
      en: 'Task in the church’s interest or in the exercise of official authority',
      de: 'Aufgabe im kirchlichen Interesse oder in Ausübung öffentlicher Gewalt',
      fr: 'Mission d’intérêt ecclésial ou relevant de l’exercice de l’autorité publique',
      pl: 'Zadanie realizowane w interesie Kościoła lub w ramach władzy publicznej',
      cs: 'Úkol v zájmu církve nebo při výkonu veřejné moci',
    },
    'specialCategoryBasis.nonprofit_body': CHURCH_BODY_LABEL,
    'specialCategoryBasis.public_interest': {
      en: 'Substantial church interest under church law',
      de: 'Erhebliches kirchliches Interesse auf Grundlage kirchlichen Rechts',
      fr: 'Intérêt ecclésial important sur le fondement du droit ecclésial',
      pl: 'Ważny interes Kościoła na podstawie prawa kościelnego',
      cs: 'Významný zájem církve na základě církevního práva',
    },
    'specialCategoryCondition.public_interest': {
      en: 'Only where church law requires or permits the processing for a substantial church interest, with safeguards for the person; name that provision below.',
      de: 'Nur wenn kirchliches Recht die Verarbeitung aus einem erheblichen kirchlichen Interesse vorschreibt oder erlaubt und Schutzmaßnahmen vorsieht; nenne die Vorschrift unten.',
      fr: 'Uniquement si le droit ecclésial impose ou autorise le traitement pour un intérêt ecclésial important, avec des garanties pour la personne ; indiquez cette disposition ci-dessous.',
      pl: 'Tylko jeśli prawo kościelne nakazuje lub dopuszcza przetwarzanie ze względu na ważny interes Kościoła i przewiduje zabezpieczenia; wskaż ten przepis poniżej.',
      cs: 'Jen pokud církevní právo zpracování ukládá nebo dovoluje z významného zájmu církve a stanoví záruky; uveď toto ustanovení níže.',
    },
  },
  cautions: {
    // § 6 Abs. 1 lit. g Satz 2 KDG.
    'legalBasis.legitimate_interests': {
      en: 'Not available to church bodies organised under public law, such as parishes and dioceses, for processing in performance of their tasks. Check whether your organisation may rely on it.',
      de: 'Nicht für öffentlich-rechtlich verfasste kirchliche Stellen wie Kirchengemeinden und Diözesen, wenn sie Daten in Erfüllung ihrer Aufgaben verarbeiten. Prüfe, ob deine Organisation sich darauf stützen darf.',
      fr: 'Non applicable aux entités ecclésiales de droit public, comme les paroisses et les diocèses, pour les traitements effectués dans l’exercice de leurs missions. Vérifiez si votre organisation peut s’en prévaloir.',
      pl: 'Niedostępne dla kościelnych podmiotów prawa publicznego, takich jak parafie i diecezje, przy przetwarzaniu w ramach ich zadań. Sprawdź, czy Twoja organizacja może się na nie powołać.',
      cs: 'Nelze použít pro církevní subjekty veřejného práva, jako jsou farnosti a diecéze, při zpracování v rámci plnění jejich úkolů. Ověř, zda se o něj tvá organizace může opřít.',
    },
  },
};

/**
 * EKD-Datenschutzgesetz, as promulgated on 15.01.2025 (ABl. EKD 2025 Nr. 1),
 * in force from 01.05.2025. Landeskirchen may add implementing and
 * supplementary rules (§ 54 Abs. 2); those are the organizer's to check.
 * Citations verified against that text (docs/privacy.md, 4).
 */
export const DSG_EKD_RECORD: FrameworkRecord = {
  framework: 'dsg_ekd',
  version: 'dsg-ekd-2025-01-15',
  name: 'DSG-EKD – Datenschutzgesetz der Evangelischen Kirche in Deutschland',
  baseline: {
    en: 'version of 15.01.2025, in force since 01.05.2025',
    de: 'Fassung vom 15.01.2025, gültig seit 01.05.2025',
    fr: 'version du 15.01.2025, en vigueur depuis le 01.05.2025',
    pl: 'brzmienie z 15.01.2025, obowiązujące od 01.05.2025',
    cs: 'znění ze dne 15.01.2025, platné od 01.05.2025',
  },
  authority: 'entered',
  authorityHint: {
    en: 'The supervisory authority your regional church set up, alone or jointly, or the EKD’s, if the task was handed to it (§ 39 DSG-EKD).',
    de: 'Die Aufsichtsbehörde, die deine Landeskirche allein oder gemeinsam errichtet hat, oder die der EKD, wenn ihr die Aufgabe übertragen wurde (§ 39 DSG-EKD).',
    fr: 'L’autorité de contrôle instituée par votre Église régionale, seule ou conjointement, ou celle de l’EKD si la mission lui a été confiée (§ 39 DSG-EKD).',
    pl: 'Organ nadzorczy ustanowiony przez Twój Kościół krajowy samodzielnie lub wspólnie albo organ EKD, jeśli przekazano mu to zadanie (§ 39 DSG-EKD).',
    cs: 'Dozorový úřad, který zřídila tvá zemská církev sama nebo společně, nebo úřad EKD, pokud mu byl úkol svěřen (§ 39 DSG-EKD).',
  },
  citations: {
    'legalBasis.consent': dsgEkd('§ 6 Nr. 2'),
    'legalBasis.contract': dsgEkd('§ 6 Nr. 5'),
    'legalBasis.legal_obligation': dsgEkd('§ 6 Nr. 6'),
    'legalBasis.vital_interests': dsgEkd('§ 6 Nr. 7'),
    'legalBasis.public_task': dsgEkd('§ 6 Nr. 3'),
    'legalBasis.legitimate_interests': dsgEkd('§ 6 Nr. 4'),
    'specialCategoryBasis.explicit_consent': dsgEkd('§ 13 Abs. 2 Nr. 1'),
    'specialCategoryBasis.vital_interests': dsgEkd('§ 13 Abs. 2 Nr. 3'),
    'specialCategoryBasis.nonprofit_body': dsgEkd('§ 13 Abs. 2 Nr. 4'),
    'specialCategoryBasis.legal_claims': dsgEkd('§ 13 Abs. 2 Nr. 6'),
    'specialCategoryBasis.public_interest': dsgEkd('§ 13 Abs. 2 Nr. 7'),
    'specialCategoryBasis.health_care': dsgEkd('§ 13 Abs. 2 Nr. 8'),
    'right.access': dsgEkd('§ 19'),
    'right.rectification': dsgEkd('§ 20'),
    'right.erasure': dsgEkd('§ 21'),
    'right.restriction': dsgEkd('§ 22'),
    'right.portability': dsgEkd('§ 24'),
    'right.object': dsgEkd('§ 25'),
    specialCategories: dsgEkd('§ 13'),
    withdrawal: dsgEkd('§ 11 Abs. 3'),
    freelyGiven: dsgEkd('§ 11 Abs. 4'),
    automatedInformation: dsgEkd('§ 17 Abs. 2 Nr. 5'),
    transferDerogation: dsgEkd('§ 10 Abs. 2'),
  },
  labels: {
    'legalBasis.public_task': {
      en: 'Performance of the controller’s tasks, including church supervision',
      de: 'Erfüllung der Aufgaben der verantwortlichen Stelle, einschließlich kirchlicher Aufsicht',
      fr: 'Exécution des missions du responsable du traitement, y compris la surveillance ecclésiale',
      pl: 'Wykonywanie zadań administratora, w tym nadzoru kościelnego',
      cs: 'Plnění úkolů správce včetně církevního dohledu',
    },
    'specialCategoryBasis.nonprofit_body': CHURCH_BODY_LABEL,
    'specialCategoryBasis.public_interest': {
      en: 'Substantial public or church interest under church or state law',
      de: 'Erhebliches öffentliches oder kirchliches Interesse auf Grundlage kirchlichen oder staatlichen Rechts',
      fr: 'Intérêt public ou ecclésial important sur le fondement du droit ecclésial ou étatique',
      pl: 'Ważny interes publiczny lub Kościoła na podstawie prawa kościelnego lub państwowego',
      cs: 'Významný veřejný nebo církevní zájem na základě církevního nebo státního práva',
    },
    'specialCategoryCondition.public_interest': {
      en: 'Only where church or state law requires or permits the processing for a substantial public or church interest, with safeguards for the person; name that provision below.',
      de: 'Nur wenn kirchliches oder staatliches Recht die Verarbeitung aus einem erheblichen öffentlichen oder kirchlichen Interesse vorschreibt oder erlaubt und Schutzmaßnahmen vorsieht; nenne die Vorschrift unten.',
      fr: 'Uniquement si le droit ecclésial ou étatique impose ou autorise le traitement pour un intérêt public ou ecclésial important, avec des garanties pour la personne ; indiquez cette disposition ci-dessous.',
      pl: 'Tylko jeśli prawo kościelne lub państwowe nakazuje lub dopuszcza przetwarzanie ze względu na ważny interes publiczny lub Kościoła i przewiduje zabezpieczenia; wskaż ten przepis poniżej.',
      cs: 'Jen pokud církevní nebo státní právo zpracování ukládá nebo dovoluje z významného veřejného nebo církevního zájmu a stanoví záruky; uveď toto ustanovení níže.',
    },
  },
};

/** Current records. Superseded ones are added to `RECORD_VERSIONS` only. */
const FRAMEWORK_RECORDS: Partial<
  Record<DataProtectionFramework, FrameworkRecord>
> = {
  gdpr: GDPR_RECORD,
  kdg: KDG_RECORD,
  dsg_ekd: DSG_EKD_RECORD,
};

const RECORD_VERSIONS = new Map<string, FrameworkRecord>(
  Object.values(FRAMEWORK_RECORDS).map((record) => [record.version, record]),
);

/**
 * The record of a law the platform cites, or null where it has none — the
 * notice then generates no legal text of its own (`generatesLegalText`).
 * With a `version`, the record a notice was published with, so its
 * citations stay as they were even after the law is renumbered.
 */
export function frameworkRecord(
  framework: DataProtectionFramework,
  version?: string | null,
): FrameworkRecord | null {
  const published = version ? RECORD_VERSIONS.get(version) : undefined;
  if (published?.framework === framework) {
    return published;
  }
  return FRAMEWORK_RECORDS[framework] ?? null;
}

/**
 * The basis a purpose preset pre-selects under `framework`, or null where
 * the law attaches a condition to it: the author then chooses.
 */
export function presetLegalBasis(
  basis: LegalBasisKey,
  framework: DataProtectionFramework,
): LegalBasisKey | null {
  return frameworkRecord(framework)?.cautions?.[`legalBasis.${basis}`]
    ? null
    : basis;
}

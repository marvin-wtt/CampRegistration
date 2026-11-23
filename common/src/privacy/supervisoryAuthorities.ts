import {
  generatesLegalText,
  noticeFramework,
  type PrivacyNoticeContent,
} from './content.js';
import { frameworkRecord } from './frameworks.js';

/**
 * Art. 13(2)(d) requires the notice to name the supervisory authority a data
 * subject may complain to. It follows from the controller's establishment, so
 * it is derived from `Organization.country` rather than asked for.
 */
export interface SupervisoryAuthority {
  name: string;
  website: string;
  /** Set where the country code alone does not identify the competent body. */
  regional?: boolean;
}

/** Keyed by lowercase ISO 3166-1 alpha-2 code, like `Organization.country`. */
export const SUPERVISORY_AUTHORITIES: Record<string, SupervisoryAuthority> = {
  at: {
    name: 'Österreichische Datenschutzbehörde',
    website: 'https://www.dsb.gv.at',
  },
  be: {
    name: 'Gegevensbeschermingsautoriteit / Autorité de protection des données',
    website: 'https://www.dataprotectionauthority.be',
  },
  bg: {
    name: 'Комисия за защита на личните данни',
    website: 'https://www.cpdp.bg',
  },
  hr: {
    name: 'Agencija za zaštitu osobnih podataka',
    website: 'https://azop.hr',
  },
  cy: {
    name: 'Γραφείο Επιτρόπου Προστασίας Δεδομένων Προσωπικού Χαρακτήρα',
    website: 'https://www.dataprotection.gov.cy',
  },
  cz: {
    name: 'Úřad pro ochranu osobních údajů',
    website: 'https://uoou.gov.cz',
  },
  dk: { name: 'Datatilsynet', website: 'https://www.datatilsynet.dk' },
  ee: { name: 'Andmekaitse Inspektsioon', website: 'https://www.aki.ee' },
  fi: {
    name: 'Tietosuojavaltuutetun toimisto',
    website: 'https://tietosuoja.fi',
  },
  fr: {
    name: 'Commission Nationale de l’Informatique et des Libertés (CNIL)',
    website: 'https://www.cnil.fr',
  },
  // Non-public bodies answer to the authority of their Land, not the BfDI.
  // Regional: the notice names no body and links the list of all of them.
  de: {
    name: 'Datenschutzaufsichtsbehörden der Länder',
    website:
      'https://www.datenschutzkonferenz-online.de/datenschutzaufsichtsbehoerden.html',
    regional: true,
  },
  gr: {
    name: 'Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα',
    website: 'https://www.dpa.gr',
  },
  hu: {
    name: 'Nemzeti Adatvédelmi és Információszabadság Hatóság',
    website: 'https://naih.hu',
  },
  ie: {
    name: 'Data Protection Commission',
    website: 'https://www.dataprotection.ie',
  },
  it: {
    name: 'Garante per la protezione dei dati personali',
    website: 'https://www.garanteprivacy.it',
  },
  lv: { name: 'Datu valsts inspekcija', website: 'https://www.dvi.gov.lv' },
  lt: {
    name: 'Valstybinė duomenų apsaugos inspekcija',
    website: 'https://vdai.lrv.lt',
  },
  lu: {
    name: 'Commission nationale pour la protection des données',
    website: 'https://cnpd.public.lu',
  },
  mt: {
    name: 'Information and Data Protection Commissioner',
    website: 'https://idpc.org.mt',
  },
  nl: {
    name: 'Autoriteit Persoonsgegevens',
    website: 'https://autoriteitpersoonsgegevens.nl',
  },
  pl: {
    name: 'Urząd Ochrony Danych Osobowych',
    website: 'https://uodo.gov.pl',
  },
  pt: {
    name: 'Comissão Nacional de Proteção de Dados',
    website: 'https://www.cnpd.pt',
  },
  ro: {
    name: 'Autoritatea Naţională de Supraveghere a Prelucrării Datelor cu Caracter Personal',
    website: 'https://www.dataprotection.ro',
  },
  sk: {
    name: 'Úrad na ochranu osobných údajov Slovenskej republiky',
    website: 'https://dataprotection.gov.sk',
  },
  si: { name: 'Informacijski pooblaščenec', website: 'https://www.ip-rs.si' },
  es: {
    name: 'Agencia Española de Protección de Datos',
    website: 'https://www.aepd.es',
  },
  se: {
    name: 'Integritetsskyddsmyndigheten',
    website: 'https://www.imy.se',
  },
  is: { name: 'Persónuvernd', website: 'https://www.personuvernd.is' },
  li: {
    name: 'Datenschutzstelle',
    website: 'https://www.datenschutzstelle.li',
  },
  no: { name: 'Datatilsynet', website: 'https://www.datatilsynet.no' },
  ch: {
    name: 'Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter',
    website: 'https://www.edoeb.admin.ch',
  },
  gb: {
    name: "Information Commissioner's Office",
    website: 'https://ico.org.uk',
  },
};

/**
 * The authority a notice names: derived from the country under a law whose
 * record says so (the GDPR), else the one the author entered, else none —
 * never guessed (docs/privacy.md, 4).
 */
export function noticeSupervisoryAuthority(
  content: PrivacyNoticeContent | null | undefined,
  country: string,
): SupervisoryAuthority | null {
  if (!generatesLegalText(content)) {
    return null;
  }
  const record = frameworkRecord(
    noticeFramework(content),
    content?.frameworkVersion,
  );
  if (!record) {
    return null;
  }
  if (record.authority === 'derived') {
    return supervisoryAuthorityFor(country);
  }
  const entered = content?.supervisoryAuthority;
  return entered?.name
    ? { name: entered.name, website: entered.website ?? '' }
    : null;
}

export function supervisoryAuthorityFor(
  country: string,
): SupervisoryAuthority | null {
  return SUPERVISORY_AUTHORITIES[country] ?? null;
}

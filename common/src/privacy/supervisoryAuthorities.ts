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

export const SUPERVISORY_AUTHORITIES: Record<string, SupervisoryAuthority> = {
  AT: {
    name: 'Österreichische Datenschutzbehörde',
    website: 'https://www.dsb.gv.at',
  },
  BE: {
    name: 'Gegevensbeschermingsautoriteit / Autorité de protection des données',
    website: 'https://www.dataprotectionauthority.be',
  },
  BG: {
    name: 'Комисия за защита на личните данни',
    website: 'https://www.cpdp.bg',
  },
  HR: {
    name: 'Agencija za zaštitu osobnih podataka',
    website: 'https://azop.hr',
  },
  CY: {
    name: 'Γραφείο Επιτρόπου Προστασίας Δεδομένων Προσωπικού Χαρακτήρα',
    website: 'https://www.dataprotection.gov.cy',
  },
  CZ: {
    name: 'Úřad pro ochranu osobních údajů',
    website: 'https://uoou.gov.cz',
  },
  DK: { name: 'Datatilsynet', website: 'https://www.datatilsynet.dk' },
  EE: { name: 'Andmekaitse Inspektsioon', website: 'https://www.aki.ee' },
  FI: {
    name: 'Tietosuojavaltuutetun toimisto',
    website: 'https://tietosuoja.fi',
  },
  FR: {
    name: 'Commission Nationale de l’Informatique et des Libertés (CNIL)',
    website: 'https://www.cnil.fr',
  },
  // Events in Germany answer to the authority of their Land, not the federal
  // one; the notice must point at the state body, so this is flagged regional.
  DE: {
    name: 'Der Bundesbeauftragte für den Datenschutz und die Informationsfreiheit',
    website: 'https://www.bfdi.bund.de',
    regional: true,
  },
  GR: {
    name: 'Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα',
    website: 'https://www.dpa.gr',
  },
  HU: {
    name: 'Nemzeti Adatvédelmi és Információszabadság Hatóság',
    website: 'https://naih.hu',
  },
  IE: {
    name: 'Data Protection Commission',
    website: 'https://www.dataprotection.ie',
  },
  IT: {
    name: 'Garante per la protezione dei dati personali',
    website: 'https://www.garanteprivacy.it',
  },
  LV: { name: 'Datu valsts inspekcija', website: 'https://www.dvi.gov.lv' },
  LT: {
    name: 'Valstybinė duomenų apsaugos inspekcija',
    website: 'https://vdai.lrv.lt',
  },
  LU: {
    name: 'Commission nationale pour la protection des données',
    website: 'https://cnpd.public.lu',
  },
  MT: {
    name: 'Information and Data Protection Commissioner',
    website: 'https://idpc.org.mt',
  },
  NL: {
    name: 'Autoriteit Persoonsgegevens',
    website: 'https://autoriteitpersoonsgegevens.nl',
  },
  PL: {
    name: 'Urząd Ochrony Danych Osobowych',
    website: 'https://uodo.gov.pl',
  },
  PT: {
    name: 'Comissão Nacional de Proteção de Dados',
    website: 'https://www.cnpd.pt',
  },
  RO: {
    name: 'Autoritatea Naţională de Supraveghere a Prelucrării Datelor cu Caracter Personal',
    website: 'https://www.dataprotection.ro',
  },
  SK: {
    name: 'Úrad na ochranu osobných údajov Slovenskej republiky',
    website: 'https://dataprotection.gov.sk',
  },
  SI: { name: 'Informacijski pooblaščenec', website: 'https://www.ip-rs.si' },
  ES: {
    name: 'Agencia Española de Protección de Datos',
    website: 'https://www.aepd.es',
  },
  SE: {
    name: 'Integritetsskyddsmyndigheten',
    website: 'https://www.imy.se',
  },
  IS: { name: 'Persónuvernd', website: 'https://www.personuvernd.is' },
  LI: {
    name: 'Datenschutzstelle',
    website: 'https://www.datenschutzstelle.li',
  },
  NO: { name: 'Datatilsynet', website: 'https://www.datatilsynet.no' },
  CH: {
    name: 'Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter',
    website: 'https://www.edoeb.admin.ch',
  },
  GB: {
    name: "Information Commissioner's Office",
    website: 'https://ico.org.uk',
  },
};

export function supervisoryAuthorityFor(
  country: string,
): SupervisoryAuthority | null {
  return SUPERVISORY_AUTHORITIES[country.toUpperCase()] ?? null;
}

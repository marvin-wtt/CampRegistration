import { ProgramItemFactory } from '../factories/program-item.factory';
import type { Event } from '#generated/prisma/client.js';
import { eventLocales, forLocales } from './locales';
import moment from 'moment';

type Translated = string | Record<string, string>;

type EventData = {
  title: Translated;
  details?: Translated;
  location?: Translated;
  /** Days after the event start date. */
  day: number;
  time?: string | null;
  duration?: number | null;
  color?: string;
  plan?: 'a' | 'b' | 'both';
};

const COLOR = {
  meal: '#FF9800',
  outdoor: '#4CAF50',
  sports: '#2196F3',
  creative: '#9C27B0',
  social: '#E91E63',
  routine: '#607D8B',
  excursion: '#00BCD4',
  eventfire: '#FF5722',
};

const TITLE = {
  wakeUp: {
    en: 'Wake-up and morning exercise',
    de: 'Wecken und Morgensport',
    fr: 'Réveil et gym du matin',
  },
  breakfast: { en: 'Breakfast', de: 'Frühstück', fr: 'Petit-déjeuner' },
  lunch: { en: 'Lunch', de: 'Mittagessen', fr: 'Déjeuner' },
  dinner: { en: 'Dinner', de: 'Abendessen', fr: 'Dîner' },
  freeTime: { en: 'Free time', de: 'Freie Zeit', fr: 'Temps libre' },
  climbing: { en: 'Climbing park', de: 'Kletterpark', fr: "Parc d'escalade" },
  hike: {
    en: 'Forest hike',
    de: 'Waldwanderung',
    fr: 'Randonnée en forêt',
  },
  bushcraft: {
    en: 'Bushcraft and shelter building',
    de: 'Bushcraft und Hüttenbau',
    fr: 'Bushcraft et construction de cabanes',
  },
  teamChallenge: {
    en: 'Team challenge',
    de: 'Teamchallenge',
    fr: "Défi d'équipe",
  },
};

const LOCATION = {
  courtyard: { en: 'Manor courtyard', de: 'Innenhof', fr: 'Cour du manoir' },
  ropes: {
    en: 'High ropes course',
    de: 'Hochseilgarten',
    fr: 'Parcours acrobatique',
  },
  forestTrail: {
    en: 'North forest trail',
    de: 'Waldpfad Nord',
    fr: 'Sentier forestier nord',
  },
  forestEvent: { en: 'Forest event', de: 'Waldlager', fr: 'Event forestier' },
  firePit: { en: 'Fire pit', de: 'Feuerstelle', fr: 'Foyer' },
  sportsGround: {
    en: 'Sports ground',
    de: 'Sportplatz',
    fr: 'Terrain de sport',
  },
  workshop: { en: 'Workshop room', de: 'Werkraum', fr: 'Salle de bricolage' },
  meadow: {
    en: 'Meadow behind the barn',
    de: 'Wiese hinter der Scheune',
    fr: 'Pré derrière la grange',
  },
  hall: { en: 'Great hall', de: 'Große Halle', fr: 'Grande salle' },
  lido: { en: 'Lido', de: 'Freibad', fr: 'Piscine en plein air' },
};

/**
 * A full week without a single empty day: the same daily rhythm of wake-up,
 * meals and free time, and the two activity blocks split into an A and a B
 * group that swap over so both plans are worth looking at.
 */
const EVENTS: EventData[] = [
  // Day 0 — arrival afternoon.
  {
    title: {
      en: 'Arrival and check-in',
      de: 'Anreise und Anmeldung',
      fr: 'Arrivée et accueil',
    },
    location: LOCATION.courtyard,
    day: 0,
    time: '15:00',
    duration: 120,
    color: COLOR.outdoor,
  },
  {
    title: {
      en: 'House tour and event rules',
      de: 'Hausführung und Lagerregeln',
      fr: 'Visite du site et règlement',
    },
    day: 0,
    time: '17:00',
    duration: 60,
    color: COLOR.routine,
  },
  {
    title: TITLE.dinner,
    day: 0,
    time: '18:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Welcome games',
      de: 'Kennenlernspiele',
      fr: 'Jeux de bienvenue',
    },
    day: 0,
    time: '20:00',
    duration: 90,
    color: COLOR.social,
  },

  // Day 1 — the A/B activity blocks swap after lunch.
  {
    title: TITLE.wakeUp,
    day: 1,
    time: '08:00',
    duration: 30,
    color: COLOR.routine,
  },
  {
    title: TITLE.breakfast,
    day: 1,
    time: '08:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: TITLE.climbing,
    details: {
      en: 'Safety briefing before the first climb',
      de: 'Sicherheitseinweisung vor dem ersten Klettern',
      fr: 'Briefing sécurité avant la première montée',
    },
    location: LOCATION.ropes,
    day: 1,
    time: '10:00',
    duration: 120,
    color: COLOR.sports,
    plan: 'a',
  },
  {
    title: TITLE.hike,
    location: LOCATION.forestTrail,
    day: 1,
    time: '10:00',
    duration: 120,
    color: COLOR.outdoor,
    plan: 'b',
  },
  {
    title: TITLE.lunch,
    day: 1,
    time: '12:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: TITLE.hike,
    location: LOCATION.forestTrail,
    day: 1,
    time: '14:00',
    duration: 120,
    color: COLOR.outdoor,
    plan: 'a',
  },
  {
    title: TITLE.climbing,
    details: {
      en: 'Safety briefing before the first climb',
      de: 'Sicherheitseinweisung vor dem ersten Klettern',
      fr: 'Briefing sécurité avant la première montée',
    },
    location: LOCATION.ropes,
    day: 1,
    time: '14:00',
    duration: 120,
    color: COLOR.sports,
    plan: 'b',
  },
  {
    title: TITLE.freeTime,
    day: 1,
    time: '16:30',
    duration: 90,
    color: COLOR.routine,
  },
  {
    title: TITLE.dinner,
    day: 1,
    time: '18:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Eventfire with songs',
      de: 'Lagerfeuer mit Liedern',
      fr: 'Feu de event en chansons',
    },
    location: LOCATION.firePit,
    day: 1,
    time: '20:30',
    duration: 90,
    color: COLOR.eventfire,
  },

  // Day 2 — one big morning block, workshops in the afternoon.
  {
    title: TITLE.wakeUp,
    day: 2,
    time: '08:00',
    duration: 30,
    color: COLOR.routine,
  },
  {
    title: TITLE.breakfast,
    day: 2,
    time: '08:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Event Olympics',
      de: 'Event-Olympiade',
      fr: 'Olympiades du event',
    },
    details: {
      en: 'Mixed teams of eight',
      de: 'Gemischte Achterteams',
      fr: 'Équipes mixtes de huit',
    },
    location: LOCATION.sportsGround,
    day: 2,
    time: '09:30',
    duration: 180,
    color: COLOR.sports,
  },
  {
    title: TITLE.lunch,
    day: 2,
    time: '12:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Creative workshop',
      de: 'Kreativwerkstatt',
      fr: 'Atelier créatif',
    },
    location: LOCATION.workshop,
    day: 2,
    time: '14:30',
    duration: 120,
    color: COLOR.creative,
    plan: 'a',
  },
  {
    title: { en: 'Archery', de: 'Bogenschießen', fr: "Tir à l'arc" },
    location: LOCATION.meadow,
    day: 2,
    time: '14:30',
    duration: 120,
    color: COLOR.sports,
    plan: 'b',
  },
  {
    title: TITLE.freeTime,
    day: 2,
    time: '16:30',
    duration: 60,
    color: COLOR.routine,
  },
  {
    title: TITLE.dinner,
    day: 2,
    time: '18:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: { en: 'Game night', de: 'Spieleabend', fr: 'Soirée jeux' },
    location: LOCATION.hall,
    day: 2,
    time: '20:00',
    duration: 120,
    color: COLOR.social,
  },

  // Day 3 — the excursion takes the whole day, so nothing is split.
  {
    title: TITLE.breakfast,
    day: 3,
    time: '07:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Day trip to Cheddar Gorge',
      de: 'Tagesausflug zur Cheddar-Schlucht',
      fr: 'Excursion aux gorges de Cheddar',
    },
    details: {
      en: 'Packed lunch included, back by 15:00',
      de: 'Lunchpaket inklusive, zurück um 15:00 Uhr',
      fr: 'Panier-repas inclus, retour à 15h00',
    },
    day: 3,
    time: '09:00',
    duration: 360,
    color: COLOR.excursion,
  },
  {
    title: TITLE.freeTime,
    day: 3,
    time: '16:00',
    duration: 90,
    color: COLOR.routine,
  },
  {
    title: TITLE.dinner,
    day: 3,
    time: '18:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: { en: 'Film night', de: 'Filmabend', fr: 'Soirée cinéma' },
    location: LOCATION.hall,
    day: 3,
    time: '20:00',
    duration: 120,
    color: COLOR.social,
  },

  // Day 4 — the second A/B day, swapped again after lunch.
  {
    title: TITLE.wakeUp,
    day: 4,
    time: '08:00',
    duration: 30,
    color: COLOR.routine,
  },
  {
    title: TITLE.breakfast,
    day: 4,
    time: '08:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: TITLE.bushcraft,
    location: LOCATION.forestEvent,
    day: 4,
    time: '10:00',
    duration: 120,
    color: COLOR.outdoor,
    plan: 'a',
  },
  {
    title: TITLE.teamChallenge,
    location: LOCATION.meadow,
    day: 4,
    time: '10:00',
    duration: 120,
    color: COLOR.sports,
    plan: 'b',
  },
  {
    title: TITLE.lunch,
    day: 4,
    time: '12:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: TITLE.teamChallenge,
    location: LOCATION.meadow,
    day: 4,
    time: '14:00',
    duration: 120,
    color: COLOR.sports,
    plan: 'a',
  },
  {
    title: TITLE.bushcraft,
    location: LOCATION.forestEvent,
    day: 4,
    time: '14:00',
    duration: 120,
    color: COLOR.outdoor,
    plan: 'b',
  },
  {
    title: TITLE.freeTime,
    day: 4,
    time: '16:00',
    duration: 90,
    color: COLOR.routine,
  },
  {
    title: TITLE.dinner,
    day: 4,
    time: '18:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Night hike',
      de: 'Nachtwanderung',
      fr: 'Randonnée nocturne',
    },
    details: {
      en: 'Torches are handed out at the gate',
      de: 'Taschenlampen gibt es am Tor',
      fr: 'Les lampes de poche sont distribuées au portail',
    },
    day: 4,
    time: '20:30',
    duration: 90,
    color: COLOR.outdoor,
  },

  // Day 5 — pool day, and the first rehearsal for the closing show.
  {
    title: TITLE.wakeUp,
    day: 5,
    time: '08:00',
    duration: 30,
    color: COLOR.routine,
  },
  {
    title: TITLE.breakfast,
    day: 5,
    time: '08:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Swimming and water games',
      de: 'Schwimmen und Wasserspiele',
      fr: "Baignade et jeux d'eau",
    },
    location: LOCATION.lido,
    day: 5,
    time: '10:00',
    duration: 150,
    color: COLOR.sports,
  },
  {
    title: TITLE.lunch,
    day: 5,
    time: '13:00',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: TITLE.freeTime,
    day: 5,
    time: '14:30',
    duration: 90,
    color: COLOR.routine,
  },
  {
    title: {
      en: 'Preparing the event show',
      de: 'Vorbereitung der Abschlussshow',
      fr: 'Préparation du spectacle',
    },
    details: {
      en: 'Every group prepares one act',
      de: 'Jede Gruppe bereitet einen Beitrag vor',
      fr: 'Chaque groupe prépare un numéro',
    },
    day: 5,
    time: '16:00',
    duration: 90,
    color: COLOR.creative,
  },
  {
    title: TITLE.dinner,
    day: 5,
    time: '18:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: { en: 'Quiz night', de: 'Quizabend', fr: 'Soirée quiz' },
    location: LOCATION.hall,
    day: 5,
    time: '20:00',
    duration: 90,
    color: COLOR.social,
  },

  // Day 6 — last full day: one more A/B morning, then the closing show.
  {
    title: TITLE.wakeUp,
    day: 6,
    time: '08:00',
    duration: 30,
    color: COLOR.routine,
  },
  {
    title: TITLE.breakfast,
    day: 6,
    time: '08:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Mountain bike tour',
      de: 'Mountainbike-Tour',
      fr: 'Sortie VTT',
    },
    day: 6,
    time: '10:00',
    duration: 120,
    color: COLOR.sports,
    plan: 'a',
  },
  {
    title: {
      en: 'Orienteering',
      de: 'Orientierungslauf',
      fr: "Course d'orientation",
    },
    location: LOCATION.forestTrail,
    day: 6,
    time: '10:00',
    duration: 120,
    color: COLOR.outdoor,
    plan: 'b',
  },
  {
    title: TITLE.lunch,
    day: 6,
    time: '12:30',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Dress rehearsal',
      de: 'Generalprobe',
      fr: 'Répétition générale',
    },
    location: LOCATION.hall,
    day: 6,
    time: '14:00',
    duration: 120,
    color: COLOR.creative,
  },
  {
    title: {
      en: 'Tidy rooms and pack',
      de: 'Zimmer aufräumen und packen',
      fr: 'Rangement des chambres et bagages',
    },
    day: 6,
    time: '16:30',
    duration: 60,
    color: COLOR.routine,
  },
  {
    title: {
      en: 'Farewell dinner',
      de: 'Abschiedsessen',
      fr: "Repas d'adieu",
    },
    day: 6,
    time: '18:30',
    duration: 90,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Event show and closing ceremony',
      de: 'Abschlussshow und Abschlussfeier',
      fr: 'Spectacle et cérémonie de clôture',
    },
    location: LOCATION.hall,
    day: 6,
    time: '20:30',
    duration: 120,
    color: COLOR.social,
  },

  // Day 7 — departure morning.
  {
    title: TITLE.breakfast,
    day: 7,
    time: '08:00',
    duration: 60,
    color: COLOR.meal,
  },
  {
    title: {
      en: 'Room handover',
      de: 'Zimmerübergabe',
      fr: 'État des lieux des chambres',
    },
    day: 7,
    time: '09:00',
    duration: 60,
    color: COLOR.routine,
  },
  {
    title: { en: 'Departure', de: 'Abreise', fr: 'Départ' },
    location: LOCATION.courtyard,
    day: 7,
    time: '10:00',
    duration: null,
    color: COLOR.outdoor,
  },
];

/** A full program, laid out relative to the event's own start date. */
export class ProgramItemSeeder {
  constructor(private event: Event) {}

  async seed(): Promise<void> {
    const start = moment(this.event.startAt).startOf('day');
    const locales = eventLocales(this.event);

    for (const { day, title, details, location, ...event } of EVENTS) {
      await ProgramItemFactory.create({
        event: { connect: { id: this.event.id } },
        date: start.clone().add(day, 'days').format('YYYY-MM-DD'),
        title: forLocales(title, locales),
        details: details ? forLocales(details, locales) : undefined,
        location: location ? forLocales(location, locales) : undefined,
        ...event,
      });
    }
  }
}

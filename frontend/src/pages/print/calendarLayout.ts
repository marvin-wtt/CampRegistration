import type { ProgramItem } from '@camp-registration/common/entities';
import { parseTimeToMinutes } from '@/utils/date';

/** Smallest box that still holds a line of text. */
export const MIN_EVENT_H_PX = 11;
/** Below this height an event only shows its title, on a single line. */
export const COMPACT_EVENT_H_PX = 24;
const MIN_FONT_PX = 7;
const MAX_FONT_PX = 10;

export const DEFAULT_EVENT_COLOR = '#2196F3';
const NEUTRAL_FILL = '#f2f2f2';
// Share of the event colour in its fill. A light wash keeps the colour coding
// legible, costs little toner, and leaves the text in near-black where it stays
// readable — unlike a saturated fill, which needs white type and turns
// unreadable as soon as the colour itself is light.
const FILL_STRENGTH = 0.18;

export interface DayLayoutOptions {
  /** Minute the printed day starts at; the top of the column. */
  dayStartMinutes: number;
  /** Minutes per grid slot. */
  interval: number;
  /** Rendered height of one grid slot, in px. */
  slotHeight: number;
  /** Both plans in one column: A takes the left half, B the right. */
  splitPlans: boolean;
}

/** An event placed in a day column. Horizontal span is a 0…1 fraction. */
export interface EventBox {
  event: ProgramItem;
  startMinutes: number;
  endMinutes: number;
  top: number;
  height: number;
  x0: number;
  x1: number;
  compact: boolean;
  fontSize: number;
}

/** Working representation while a column layout is being computed. */
interface Placement {
  event: ProgramItem;
  start: number;
  end: number;
  x0: number;
  x1: number;
  lane: number;
}

/**
 * Places the timed events of one day. Events overlapping in time are put side
 * by side rather than on top of each other: on screen the stacked boxes can be
 * clicked apart, on paper a covered event is simply lost.
 */
export function layoutDayEvents(
  events: ProgramItem[],
  options: DayLayoutOptions,
): EventBox[] {
  const placements = events
    .map((event) => toPlacement(event, options.splitPlans))
    .filter((placement): placement is Placement => placement !== null)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  for (const cluster of timeClusters(placements)) {
    for (const group of splitByPlanSpan(cluster)) {
      assignLanes(group);
    }
  }

  return placements.map((placement) => toEventBox(placement, options));
}

function toPlacement(
  event: ProgramItem,
  splitPlans: boolean,
): Placement | null {
  if (!event.time || !event.duration) {
    return null;
  }
  const start = parseTimeToMinutes(event.time);
  if (start === null) {
    return null;
  }
  const half = splitPlans && event.plan !== 'both';

  return {
    event,
    start,
    end: start + event.duration,
    x0: half && event.plan === 'b' ? 0.5 : 0,
    x1: half && event.plan === 'a' ? 0.5 : 1,
    lane: 0,
  };
}

/** Runs of events whose time ranges overlap, transitively. */
function timeClusters(placements: Placement[]): Placement[][] {
  const clusters: Placement[][] = [];
  let current: Placement[] = [];
  let clusterEnd = -Infinity;

  for (const placement of placements) {
    if (current.length > 0 && placement.start >= clusterEnd) {
      clusters.push(current);
      current = [];
    }
    current.push(placement);
    clusterEnd = Math.max(clusterEnd, placement.end);
  }
  if (current.length > 0) {
    clusters.push(current);
  }

  return clusters;
}

/**
 * With both plans shown, the A and B halves are disjoint, so events of
 * different plans never fight over pixels and can be packed independently. A
 * `both` event spans the full width and competes with either half, so as soon
 * as one is in the cluster the whole cluster is packed as a single group.
 */
function splitByPlanSpan(cluster: Placement[]): Placement[][] {
  if (cluster.some((placement) => placement.x0 === 0 && placement.x1 === 1)) {
    return [cluster];
  }

  return [
    cluster.filter((placement) => placement.x1 <= 0.5),
    cluster.filter((placement) => placement.x0 >= 0.5),
  ].filter((group) => group.length > 0);
}

/**
 * Greedy lane packing: every event takes the first lane free at its start time.
 * Once a group needs more than one lane its span is divided evenly, so nothing
 * ends up hidden; a single lane leaves each event on its own plan half.
 */
function assignLanes(group: Placement[]): void {
  const laneEnds: number[] = [];

  for (const placement of group) {
    let lane = laneEnds.findIndex((end) => end <= placement.start);
    if (lane === -1) {
      lane = laneEnds.length;
    }
    laneEnds[lane] = placement.end;
    placement.lane = lane;
  }

  if (laneEnds.length < 2) {
    return;
  }

  const x0 = Math.min(...group.map((placement) => placement.x0));
  const x1 = Math.max(...group.map((placement) => placement.x1));
  const laneWidth = (x1 - x0) / laneEnds.length;

  for (const placement of group) {
    placement.x0 = x0 + placement.lane * laneWidth;
    placement.x1 = placement.x0 + laneWidth;
  }
}

function toEventBox(placement: Placement, options: DayLayoutOptions): EventBox {
  const { interval, slotHeight, dayStartMinutes } = options;
  const { start, end } = placement;

  const top = ((start - dayStartMinutes) / interval) * slotHeight;
  const height = Math.max(
    ((end - start) / interval) * slotHeight - 1,
    MIN_EVENT_H_PX,
  );

  return {
    event: placement.event,
    startMinutes: start,
    endMinutes: end,
    top,
    height,
    x0: placement.x0,
    x1: placement.x1,
    compact: height < COMPACT_EVENT_H_PX,
    fontSize: baseFontSize(height),
  };
}

/** Larger boxes get larger type, within a range that still prints legibly. */
export function baseFontSize(height: number): number {
  const size = 6.6 + height * 0.045;

  return Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, Math.round(size * 2) / 2));
}

/** The event colour washed out over white, as an opaque fill. */
export function fillColor(color: string): string {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return NEUTRAL_FILL;
  }
  const mixed = rgb.map((channel) =>
    Math.round(channel * FILL_STRENGTH + 255 * (1 - FILL_STRENGTH)),
  );

  return `rgb(${mixed.join(', ')})`;
}

function parseHexColor(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color.trim());
  if (!match) {
    return null;
  }
  const digits = match[1]!;
  const hex =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;

  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

/** Minutes since midnight as `HH:MM`, wrapping past the end of the day. */
export function formatMinutesAsTime(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(total / 60)).padStart(2, '0');

  return `${hours}:${String(total % 60).padStart(2, '0')}`;
}

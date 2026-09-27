/**
 * Fisher-Yates shuffle applied only within consecutive runs of tied items, so
 * the sort order is untouched but ties don't always list the same way.
 */
export function shuffleTiedRuns<T>(
  items: readonly T[],
  isTied: (a: T, b: T) => boolean,
  random: () => number = Math.random,
): T[] {
  const runs: T[][] = [];
  for (const item of items) {
    const run = runs.at(-1);
    const first = run?.[0];
    if (run && first !== undefined && isTied(first, item)) {
      run.push(item);
    } else {
      runs.push([item]);
    }
  }

  return runs.flatMap((run) => {
    const shuffled: T[] = [];
    for (const item of run) {
      shuffled.splice(Math.floor(random() * (shuffled.length + 1)), 0, item);
    }
    return shuffled;
  });
}

/**
 * Mixes groups without letting any item overtake a better-ranked one: from
 * the front run of tied items, takes the one whose group has appeared least
 * so far. `counts` seeds that tally, e.g. with groups already present.
 */
export function spreadWithinTies<T>(
  items: readonly T[],
  isTied: (a: T, b: T) => boolean,
  key: (item: T) => string,
  counts: ReadonlyMap<string, number> = new Map(),
): T[] {
  const tally = new Map(counts);
  const remaining = [...items];
  const result: T[] = [];

  for (let head = remaining[0]; head !== undefined; head = remaining[0]) {
    let bestIndex = 0;
    let bestCount = tally.get(key(head)) ?? 0;
    for (let index = 1; index < remaining.length; index++) {
      const item = remaining[index];
      if (item === undefined || !isTied(head, item)) {
        break;
      }
      const count = tally.get(key(item)) ?? 0;
      if (count < bestCount) {
        bestIndex = index;
        bestCount = count;
      }
    }

    const [picked] = remaining.splice(bestIndex, 1);
    if (picked !== undefined) {
      result.push(picked);
      tally.set(key(picked), bestCount + 1);
    }
  }

  return result;
}

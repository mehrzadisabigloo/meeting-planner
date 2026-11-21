/**
 * Converts "HH:mm" to total minutes from midnight.
 * Throws a clear error for invalid input so callers can decide to skip or surface it.
 */
export function toMinutes(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Invalid time format: "${time}". Expected "HH:mm".`);
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23 || m > 59) throw new Error(`Out-of-range time: "${time}".`);
  return h * 60 + m;
}

/** Converts total minutes from midnight back to "HH:mm". */
export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Merges overlapping/touching intervals (sorted by start).
 * Input: array of [start, end] in minutes.
 * Output: merged array of [start, end] in minutes.
 * Complexity: O(n log n) due to sort; O(n) space.
 */
export function mergeIntervals(intervals: [number, number][]): [number, number][] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const [start, end] = sorted[i];
    if (start <= last[1]) {
      // Overlapping or touching — extend the current block
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged;
}

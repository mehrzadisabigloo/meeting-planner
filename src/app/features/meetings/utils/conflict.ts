import { Meeting } from '../../../core/models/models';
import { toMinutes } from './time.utils';

interface TimeRange {
  startTime: string;
  endTime: string;
}

/**
 * Returns true if two time ranges overlap.
 * Touching boundaries (end of one == start of other) are NOT a conflict.
 */
export function hasConflict(a: TimeRange, b: TimeRange): boolean {
  const aStart = toMinutes(a.startTime);
  const aEnd = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd = toMinutes(b.endTime);
  // Overlap iff one starts strictly before the other ends
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Finds the first meeting in `existing` that conflicts with `candidate`.
 * Pass `ignoreId` to exclude the meeting being edited from the check.
 */
export function findConflict(
  candidate: TimeRange,
  existing: Meeting[],
  ignoreId?: string,
): Meeting | undefined {
  return existing.find(
    (m) => m.id !== ignoreId && hasConflict(candidate, m),
  );
}

/**
 * Returns total occupied minutes for a set of meetings,
 * merging overlapping intervals so they are not double-counted.
 */
export function totalOccupiedMinutes(meetings: Pick<Meeting, 'startTime' | 'endTime'>[]): number {
  // Reuse mergeIntervals logic inline to avoid circular deps with free-slots
  const intervals: [number, number][] = meetings.map((m) => [
    toMinutes(m.startTime),
    toMinutes(m.endTime),
  ]);
  if (intervals.length === 0) return 0;

  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const [s, e] = sorted[i];
    if (s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }
  return merged.reduce((sum, [s, e]) => sum + (e - s), 0);
}

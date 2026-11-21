import { FreeSlot, Meeting } from '../../../core/models/models';
import { mergeIntervals, toMinutes, toTime } from './time.utils';

/**
 * Calculates free time slots in a working day given a list of meetings.
 *
 * Strategy:
 * 1. Convert each meeting to a [startMin, endMin] interval (skip invalid times).
 * 2. Clip intervals to working hours.
 * 3. Sort + merge overlapping intervals (O(n log n)).
 * 4. Compute gaps between merged blocks and working-hour boundaries.
 *
 * Invalid time strings are silently skipped (documented choice: the function
 * is a display helper; throwing would crash the whole list for one bad record).
 *
 * Time complexity: O(n log n) — dominated by the sort in mergeIntervals.
 * Space complexity: O(n).
 */
export function calculateFreeSlots(
  meetings: Pick<Meeting, 'startTime' | 'endTime'>[],
  workStart = '08:00',
  workEnd = '18:00',
): FreeSlot[] {
  const wsMin = toMinutes(workStart);
  const weMin = toMinutes(workEnd);

  // Build intervals, skip invalid or fully-out-of-hours entries
  const intervals: [number, number][] = [];
  for (const m of meetings) {
    let start: number;
    let end: number;
    try {
      start = toMinutes(m.startTime);
      end = toMinutes(m.endTime);
    } catch {
      // Skip records with unparseable times
      continue;
    }
    if (end <= start) continue; // zero/negative duration — skip
    // Clip to working hours
    const clippedStart = Math.max(start, wsMin);
    const clippedEnd = Math.min(end, weMin);
    if (clippedEnd <= clippedStart) continue; // fully outside working hours
    intervals.push([clippedStart, clippedEnd]);
  }

  const merged = mergeIntervals(intervals);

  // Compute gaps
  const freeSlots: FreeSlot[] = [];
  let cursor = wsMin;

  for (const [busyStart, busyEnd] of merged) {
    if (busyStart > cursor) {
      freeSlots.push(makeSlot(cursor, busyStart));
    }
    cursor = Math.max(cursor, busyEnd);
  }

  // Remaining time after last meeting
  if (cursor < weMin) {
    freeSlots.push(makeSlot(cursor, weMin));
  }

  return freeSlots;
}

function makeSlot(startMin: number, endMin: number): FreeSlot {
  return {
    startTime: toTime(startMin),
    endTime: toTime(endMin),
    durationInMinutes: endMin - startMin,
  };
}

/**
 * Returns the first free slot with duration >= minDuration, or null.
 * Used to display "nearest free slot of at least 30 min" on the list page.
 */
export function nextFreeSlot(
  meetings: Pick<Meeting, 'startTime' | 'endTime'>[],
  minDurationMinutes = 30,
  workStart = '08:00',
  workEnd = '18:00',
): FreeSlot | null {
  return (
    calculateFreeSlots(meetings, workStart, workEnd).find(
      (s) => s.durationInMinutes >= minDurationMinutes,
    ) ?? null
  );
}

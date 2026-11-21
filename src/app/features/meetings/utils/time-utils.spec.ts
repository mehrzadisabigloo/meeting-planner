import { calculateFreeSlots } from './free-slots';
import { findConflict, hasConflict, totalOccupiedMinutes } from './conflict';
import { mergeIntervals, toMinutes, toTime } from './time.utils';

// ---------------------------------------------------------------------------
// toMinutes / toTime
// ---------------------------------------------------------------------------
describe('toMinutes', () => {
  it('converts "08:00" to 480', () => expect(toMinutes('08:00')).toBe(480));
  it('converts "18:00" to 1080', () => expect(toMinutes('18:00')).toBe(1080));
  it('throws on invalid format', () => expect(() => toMinutes('9:00')).toThrow());
  it('throws on out-of-range minutes', () => expect(() => toMinutes('08:60')).toThrow());
});

describe('toTime', () => {
  it('converts 480 to "08:00"', () => expect(toTime(480)).toBe('08:00'));
  it('converts 570 to "09:30"', () => expect(toTime(570)).toBe('09:30'));
});

// ---------------------------------------------------------------------------
// mergeIntervals
// ---------------------------------------------------------------------------
describe('mergeIntervals', () => {
  it('returns empty array for empty input', () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it('merges overlapping intervals', () => {
    const result = mergeIntervals([[540, 630], [600, 660], [645, 720]]);
    expect(result).toEqual([[540, 720]]);
  });

  it('merges touching intervals (back-to-back)', () => {
    const result = mergeIntervals([[540, 600], [600, 660]]);
    // Touching boundaries merge into one block
    expect(result).toEqual([[540, 660]]);
  });

  it('keeps separate non-overlapping intervals', () => {
    const result = mergeIntervals([[480, 540], [600, 660]]);
    expect(result).toEqual([[480, 540], [600, 660]]);
  });
});

// ---------------------------------------------------------------------------
// 1. calculateFreeSlots — normal case
// ---------------------------------------------------------------------------
describe('calculateFreeSlots — normal case', () => {
  it('returns correct free slots for a typical day', () => {
    const meetings = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:30', endTime: '11:15' },
      { startTime: '14:00', endTime: '15:30' },
    ];
    const slots = calculateFreeSlots(meetings);
    expect(slots).toEqual([
      { startTime: '08:00', endTime: '09:00', durationInMinutes: 60 },
      { startTime: '10:00', endTime: '10:30', durationInMinutes: 30 },
      { startTime: '11:15', endTime: '14:00', durationInMinutes: 165 },
      { startTime: '15:30', endTime: '18:00', durationInMinutes: 150 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 2. Merging overlapping meetings (chain: 09:00-10:30, 10:00-11:00, 10:45-12:00)
// ---------------------------------------------------------------------------
describe('calculateFreeSlots — overlapping chain treated as one block', () => {
  it('treats 09:00-10:30, 10:00-11:00, 10:45-12:00 as one busy block 09:00-12:00', () => {
    const meetings = [
      { startTime: '09:00', endTime: '10:30' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '10:45', endTime: '12:00' },
    ];
    const slots = calculateFreeSlots(meetings);
    expect(slots).toEqual([
      { startTime: '08:00', endTime: '09:00', durationInMinutes: 60 },
      { startTime: '12:00', endTime: '18:00', durationInMinutes: 360 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 3. Overlap detection between two meetings
// ---------------------------------------------------------------------------
describe('hasConflict', () => {
  it('detects overlap: 09:00-10:00 and 09:45-10:30', () => {
    expect(hasConflict(
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '09:45', endTime: '10:30' },
    )).toBeTrue();
  });

  it('detects overlap when one meeting is fully inside another', () => {
    expect(hasConflict(
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '10:00', endTime: '11:00' },
    )).toBeTrue();
  });
});

// ---------------------------------------------------------------------------
// 4. Back-to-back meetings are NOT a conflict
// ---------------------------------------------------------------------------
describe('hasConflict — back-to-back', () => {
  it('09:00-10:00 and 10:00-11:00 do NOT conflict', () => {
    expect(hasConflict(
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
    )).toBeFalse();
  });
});

// ---------------------------------------------------------------------------
// 5. Edge cases
// ---------------------------------------------------------------------------
describe('calculateFreeSlots — edge cases', () => {
  it('returns full working day as one free slot when no meetings', () => {
    const slots = calculateFreeSlots([]);
    expect(slots).toEqual([
      { startTime: '08:00', endTime: '18:00', durationInMinutes: 600 },
    ]);
  });

  it('returns no free slots when a meeting covers the entire working day', () => {
    const slots = calculateFreeSlots([{ startTime: '08:00', endTime: '18:00' }]);
    expect(slots).toEqual([]);
  });

  it('clips meetings that start before working hours', () => {
    const slots = calculateFreeSlots([{ startTime: '06:00', endTime: '09:00' }]);
    expect(slots[0].startTime).toBe('09:00');
  });

  it('clips meetings that end after working hours', () => {
    const slots = calculateFreeSlots([{ startTime: '17:00', endTime: '20:00' }]);
    const last = slots[slots.length - 1];
    expect(last.endTime).toBe('17:00');
  });

  it('handles unsorted input correctly', () => {
    const meetings = [
      { startTime: '14:00', endTime: '15:30' },
      { startTime: '09:00', endTime: '10:00' },
    ];
    const slots = calculateFreeSlots(meetings);
    expect(slots[0]).toEqual({ startTime: '08:00', endTime: '09:00', durationInMinutes: 60 });
    expect(slots[1]).toEqual({ startTime: '10:00', endTime: '14:00', durationInMinutes: 240 });
    expect(slots[2]).toEqual({ startTime: '15:30', endTime: '18:00', durationInMinutes: 150 });
  });

  it('skips meetings with invalid time strings', () => {
    const meetings = [
      { startTime: 'bad', endTime: '10:00' },
      { startTime: '09:00', endTime: '10:00' },
    ];
    // Should not throw; the bad entry is skipped
    expect(() => calculateFreeSlots(meetings)).not.toThrow();
    const slots = calculateFreeSlots(meetings);
    expect(slots[0]).toEqual({ startTime: '08:00', endTime: '09:00', durationInMinutes: 60 });
  });
});

// ---------------------------------------------------------------------------
// findConflict with ignoreId
// ---------------------------------------------------------------------------
describe('findConflict', () => {
  const existing = [
    { id: 'm1', title: 'A', organizer: '', roomId: 'r1', date: '2026-08-03', startTime: '09:00', endTime: '10:00', attendeesCount: 2 },
    { id: 'm2', title: 'B', organizer: '', roomId: 'r1', date: '2026-08-03', startTime: '11:00', endTime: '12:00', attendeesCount: 2 },
  ];

  it('finds a conflicting meeting', () => {
    const conflict = findConflict({ startTime: '09:30', endTime: '10:30' }, existing);
    expect(conflict?.id).toBe('m1');
  });

  it('returns undefined when no conflict', () => {
    const conflict = findConflict({ startTime: '10:00', endTime: '11:00' }, existing);
    expect(conflict).toBeUndefined();
  });

  it('ignores the meeting being edited (ignoreId)', () => {
    const conflict = findConflict({ startTime: '09:30', endTime: '10:30' }, existing, 'm1');
    expect(conflict).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// totalOccupiedMinutes
// ---------------------------------------------------------------------------
describe('totalOccupiedMinutes', () => {
  it('returns 0 for empty list', () => {
    expect(totalOccupiedMinutes([])).toBe(0);
  });

  it('does not double-count overlapping meetings', () => {
    const meetings = [
      { startTime: '09:00', endTime: '10:30' },
      { startTime: '10:00', endTime: '11:00' },
    ];
    // Merged: 09:00-11:00 = 120 min
    expect(totalOccupiedMinutes(meetings)).toBe(120);
  });

  it('sums non-overlapping meetings', () => {
    const meetings = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '11:00', endTime: '12:00' },
    ];
    expect(totalOccupiedMinutes(meetings)).toBe(120);
  });
});

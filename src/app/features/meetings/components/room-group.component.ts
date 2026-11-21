import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Meeting, Room, FreeSlot } from '../../../core/models/models';
import { MeetingCardComponent } from './meeting-card.component';
import { toMinutes } from '../utils/time.utils';

const WORK_START = 480; // 08:00
const WORK_TOTAL = 600; // 10 hours

@Component({
  selector: 'app-room-group',
  standalone: true,
  imports: [MeetingCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './room-group.component.html',
  styleUrl: './room-group.component.scss',
})
export class RoomGroupComponent {
  room = input.required<Room>();
  meetings = input.required<Meeting[]>();
  nextFreeSlot = input<FreeSlot | null>(null);
  deletingId = input<string | null>(null);
  occupancyPercent = input(0);

  editMeeting = output<Meeting>();
  deleteMeeting = output<Meeting>();

  readonly totalMinutes = computed(() =>
    this.meetings().reduce((sum, m) => {
      try { return sum + toMinutes(m.endTime) - toMinutes(m.startTime); }
      catch { return sum; }
    }, 0),
  );

  readonly formattedTotal = computed(() => {
    const mins = this.totalMinutes();
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  });

  /** Timeline blocks for visual display */
  readonly timelineBlocks = computed(() =>
    this.meetings().map((m) => {
      try {
        const start = toMinutes(m.startTime) - WORK_START;
        const duration = toMinutes(m.endTime) - toMinutes(m.startTime);
        return {
          meeting: m,
          left: (start / WORK_TOTAL) * 100,
          width: (duration / WORK_TOTAL) * 100,
        };
      } catch {
        return null;
      }
    }).filter((b): b is NonNullable<typeof b> => b !== null),
  );

  readonly roomColorClass = computed(() => {
    const id = this.room().id;
    if (id === 'room-atlas') return 'room--atlas';
    if (id === 'room-orion') return 'room--orion';
    if (id === 'room-nova') return 'room--nova';
    return '';
  });
}

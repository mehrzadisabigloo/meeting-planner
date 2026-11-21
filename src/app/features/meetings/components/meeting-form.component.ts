import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { Meeting, NewMeeting, Room } from '../../../core/models/models';
import { MeetingService } from '../../../core/data-access/meeting.service';
import { findConflict } from '../utils/conflict';
import { toMinutes } from '../utils/time.utils';

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function notBlank(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim().length === 0
    ? { blank: true }
    : null;
}

function multipleOf15(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  try {
    const mins = toMinutes(control.value as string);
    return mins % 15 === 0 ? null : { multipleOf15: true };
  } catch {
    return { invalidTime: true };
  }
}

function withinWorkingHours(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  try {
    const mins = toMinutes(control.value as string);
    return mins >= 480 && mins <= 1080 ? null : { outsideHours: true };
  } catch {
    return { invalidTime: true };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meeting-form.component.html',
  styleUrl: './meeting-form.component.scss',
})
export class MeetingFormComponent implements OnInit {
  rooms = input.required<Room[]>();
  initialData = input<Meeting | null>(null);
  submitting = input(false);

  formSubmit = output<NewMeeting>();
  cancel = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly meetingService = inject(MeetingService);

  readonly form = this.fb.group({
    title: ['', [Validators.required, notBlank]],
    organizer: ['', [Validators.required, notBlank]],
    date: ['', Validators.required],
    roomId: ['', Validators.required],
    attendeesCount: [1, [Validators.required, Validators.min(1)]],
    startTime: ['', [Validators.required, multipleOf15, withinWorkingHours]],
    endTime: ['', [Validators.required, multipleOf15, withinWorkingHours]],
  });

  // Conflict error message — updated after async check
  conflictError = signal<string | null>(null);

  // Capacity error — derived from selected room + attendees count
  private readonly roomsValue = toSignal(this.form.controls.roomId.valueChanges, {
    initialValue: this.form.controls.roomId.value,
  });
  private readonly attendeesValue = toSignal(this.form.controls.attendeesCount.valueChanges, {
    initialValue: this.form.controls.attendeesCount.value,
  });

  readonly selectedRoom = computed(() =>
    this.rooms().find((r) => r.id === this.roomsValue()) ?? null,
  );

  readonly capacityError = computed(() => {
    const room = this.selectedRoom();
    const count = this.attendeesValue();
    if (!room || count === null) return null;
    return count > room.capacity
      ? `تعداد شرکت‌کنندگان از ظرفیت اتاق (${room.capacity} نفر) بیشتر است.`
      : null;
  });

  ngOnInit(): void {
    const data = this.initialData();
    if (data) {
      this.form.patchValue({
        title: data.title,
        organizer: data.organizer,
        date: data.date,
        roomId: data.roomId,
        attendeesCount: data.attendeesCount,
        startTime: data.startTime,
        endTime: data.endTime,
      });
    }
  }

  get isDirty(): boolean {
    return this.form.dirty;
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.capacityError()) return;

    // Cross-field: endTime > startTime
    const { startTime, endTime } = this.form.value;
    if (startTime && endTime) {
      try {
        if (toMinutes(endTime) <= toMinutes(startTime)) {
          this.form.controls.endTime.setErrors({ endBeforeStart: true });
          return;
        }
      } catch {
        return;
      }
    }

    // Async conflict check
    const { roomId, date } = this.form.value;
    if (roomId && date) {
      this.meetingService.getByRoomAndDate(roomId, date).subscribe({
        next: (meetings) => {
          const editId = this.initialData()?.id;
          const conflict = findConflict(
            { startTime: startTime!, endTime: endTime! },
            meetings,
            editId,
          );
          if (conflict) {
            this.conflictError.set(
              `این زمان با جلسه «${conflict.title}» از ساعت ${conflict.startTime} تا ${conflict.endTime} تداخل دارد.`,
            );
            return;
          }
          this.conflictError.set(null);
          this.emitValue();
        },
      });
    } else {
      this.emitValue();
    }
  }

  private emitValue(): void {
    const v = this.form.value;
    this.formSubmit.emit({
      title: v.title!.trim(),
      organizer: v.organizer!.trim(),
      date: v.date!,
      roomId: v.roomId!,
      attendeesCount: v.attendeesCount!,
      startTime: v.startTime!,
      endTime: v.endTime!,
    });
  }

  // Template helpers
  hasError(field: keyof typeof this.form.controls, error: string): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.touched && ctrl.hasError(error);
  }

  isTouched(field: keyof typeof this.form.controls): boolean {
    return this.form.controls[field].touched;
  }

  // Time options: 08:00 to 18:00 in 15-min steps
  readonly timeOptions: string[] = (() => {
    const opts: string[] = [];
    for (let m = 480; m <= 1080; m += 15) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      opts.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }
    return opts;
  })();
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, tap, timer } from 'rxjs';
import { Subject } from 'rxjs';

import { Meeting, Room } from '../../../../core/models/models';
import { MeetingService } from '../../../../core/data-access/meeting.service';
import { RoomService } from '../../../../core/data-access/room.service';
import { RoomGroupComponent } from '../../components/room-group.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog.component';
import { ToastComponent, ToastType } from '../../../../shared/components/toast.component';
import { nextFreeSlot } from '../../utils/free-slots';
import { totalOccupiedMinutes } from '../../utils/conflict';

const WORK_TOTAL_MINUTES = 600; // 10h

interface Toast { message: string; type: ToastType }

@Component({
  selector: 'app-meetings-list',
  standalone: true,
  imports: [FormsModule, RouterLink, RoomGroupComponent, ConfirmDialogComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meetings-list.component.html',
  styleUrl: './meetings-list.component.scss',
})
export class MeetingsListComponent implements OnInit {
  private readonly meetingService = inject(MeetingService);
  private readonly roomService = inject(RoomService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly selectedDate = signal(this.todayStr());
  readonly selectedRoomId = signal('');
  readonly searchQuery = signal('');

  readonly rooms = signal<Room[]>([]);
  readonly allMeetings = signal<Meeting[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly confirmTarget = signal<Meeting | null>(null);
  readonly toast = signal<Toast | null>(null);

  private readonly reload$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);

  // ── Derived ────────────────────────────────────────────────────────────────

  /** Client-side search filter on top of server-side date+room filter */
  readonly filteredMeetings = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.allMeetings();
    return this.allMeetings().filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.organizer.toLowerCase().includes(q),
    );
  });

  readonly groupedByRoom = computed(() =>
    this.rooms().map((room) => {
      const meetings = this.filteredMeetings()
        .filter((m) => m.roomId === room.id)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const freeSlot = nextFreeSlot(meetings);
      const occupied = totalOccupiedMinutes(meetings);
      const occupancyPercent = Math.round((occupied / WORK_TOTAL_MINUTES) * 100);

      return { room, meetings, freeSlot, occupancyPercent };
    }),
  );

  readonly hasAnyMeeting = computed(() =>
    this.groupedByRoom().some((g) => g.meetings.length > 0),
  );

  readonly hasFilterActive = computed(
    () => !!this.searchQuery() || !!this.selectedRoomId(),
  );

  constructor() {
    // React to reload$ trigger — re-fetch meetings
    this.reload$
      .pipe(
        tap(() => { this.loading.set(true); this.error.set(null); }),
        switchMap(() =>
          this.meetingService
            .getByDate(this.selectedDate(), this.selectedRoomId() || undefined)
            .pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (result === null) {
          this.error.set('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.');
        } else {
          this.allMeetings.set(result);
        }
      });
  }

  ngOnInit(): void {
    // Restore filter state from URL query params
    const params = this.route.snapshot.queryParamMap;
    const date = params.get('date');
    const roomId = params.get('roomId');
    const q = params.get('q');

    if (date) this.selectedDate.set(date);
    if (roomId) this.selectedRoomId.set(roomId);
    if (q) this.searchQuery.set(q);

    // Load rooms once
    this.roomService.getAll().subscribe((rooms) => this.rooms.set(rooms));

    this.reload$.next();
  }

  // ── URL sync ───────────────────────────────────────────────────────────────

  private syncUrl(): void {
    const queryParams: Record<string, string> = { date: this.selectedDate() };
    if (this.selectedRoomId()) queryParams['roomId'] = this.selectedRoomId();
    if (this.searchQuery()) queryParams['q'] = this.searchQuery();
    this.router.navigate([], { queryParams, replaceUrl: true });
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.syncUrl();
    this.reload$.next();
  }

  onRoomFilter(roomId: string): void {
    this.selectedRoomId.set(roomId);
    this.syncUrl();
    this.reload$.next();
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
    this.syncUrl();
  }

  onInputChange(event: Event, handler: 'date' | 'room' | 'search'): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    if (handler === 'date') this.onDateChange(value);
    else if (handler === 'room') this.onRoomFilter(value);
    else this.onSearch(value);
  }

  clearFilters(): void {
    this.selectedRoomId.set('');
    this.searchQuery.set('');
    this.syncUrl();
  }

  retry(): void {
    this.reload$.next();
  }

  onEditMeeting(meeting: Meeting): void {
    this.router.navigate(['/meetings', meeting.id, 'edit']);
  }

  onDeleteRequest(meeting: Meeting): void {
    this.confirmTarget.set(meeting);
  }

  onDeleteConfirm(): void {
    const target = this.confirmTarget();
    if (!target) return;
    this.confirmTarget.set(null);
    this.deletingId.set(target.id);

    this.meetingService.delete(target.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.allMeetings.update((list) => list.filter((m) => m.id !== target.id));
        this.showToast('جلسه با موفقیت حذف شد.', 'success');
      },
      error: () => {
        this.deletingId.set(null);
        this.showToast('حذف جلسه با خطا مواجه شد.', 'error');
      },
    });
  }

  onDeleteCancel(): void {
    this.confirmTarget.set(null);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private showToast(message: string, type: ToastType): void {
    this.toast.set({ message, type });
    timer(3000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.toast.set(null));
  }

  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  trackByRoomId(_: number, group: { room: Room }): string {
    return group.room.id;
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { NewMeeting, Room } from '../../../../core/models/models';
import { MeetingService } from '../../../../core/data-access/meeting.service';
import { RoomService } from '../../../../core/data-access/room.service';
import { MeetingFormComponent } from '../../components/meeting-form.component';
import { ToastComponent } from '../../../../shared/components/toast.component';

@Component({
  selector: 'app-meeting-create',
  standalone: true,
  imports: [RouterLink, MeetingFormComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meeting-create.component.html',
  styleUrl: './meeting-create.component.scss',
})
export class MeetingCreateComponent {
  readonly router = inject(Router);
  private readonly meetingService = inject(MeetingService);
  private readonly roomService = inject(RoomService);

  readonly rooms = signal<Room[]>([]);
  readonly submitting = signal(false);
  readonly errorMsg = signal<string | null>(null);

  constructor() {
    this.roomService.getAll().subscribe((r) => this.rooms.set(r));
  }

  onCreate(data: NewMeeting): void {
    this.submitting.set(true);
    this.meetingService.create(data).subscribe({
      next: () => this.router.navigate(['/meetings'], { queryParams: { date: data.date } }),
      error: () => {
        this.submitting.set(false);
        this.errorMsg.set('ذخیره جلسه با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
        setTimeout(() => this.errorMsg.set(null), 4000);
      },
    });
  }
}

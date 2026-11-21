import { ChangeDetectionStrategy, Component, inject, input, signal, OnInit, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CanDeactivateComponent } from './unsaved-changes.guard';

import { Meeting, NewMeeting, Room } from '../../../../core/models/models';
import { MeetingService } from '../../../../core/data-access/meeting.service';
import { RoomService } from '../../../../core/data-access/room.service';
import { MeetingFormComponent } from '../../components/meeting-form.component';
import { ToastComponent } from '../../../../shared/components/toast.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-meeting-edit',
  standalone: true,
  imports: [RouterLink, MeetingFormComponent, ToastComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meeting-edit.component.html',
  styleUrl: './meeting-edit.component.scss',
})
export class MeetingEditComponent implements OnInit, CanDeactivateComponent {
  /** Populated by the Resolver via withComponentInputBinding */
  meeting = input<Meeting | null>(null);

  readonly router = inject(Router);
  private readonly meetingService = inject(MeetingService);
  private readonly roomService = inject(RoomService);

  readonly rooms = signal<Room[]>([]);
  readonly submitting = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly showLeaveDialog = signal(false);

  private readonly formRef = viewChild<MeetingFormComponent>('formRef');
  private leaveResolver: ((value: boolean) => void) | null = null;

  get isDirty(): boolean {
    return this.formRef()?.isDirty ?? false;
  }

  confirmDeactivate(): Promise<boolean> {
    this.showLeaveDialog.set(true);
    return new Promise<boolean>((resolve) => {
      this.leaveResolver = resolve;
    });
  }

  onLeaveConfirm(): void {
    this.showLeaveDialog.set(false);
    this.leaveResolver?.(true);
    this.leaveResolver = null;
  }

  onLeaveCancel(): void {
    this.showLeaveDialog.set(false);
    this.leaveResolver?.(false);
    this.leaveResolver = null;
  }

  ngOnInit(): void {
    this.roomService.getAll().subscribe((r) => this.rooms.set(r));
  }

  onUpdate(data: NewMeeting): void {
    const id = this.meeting()?.id;
    if (!id) return;
    this.submitting.set(true);
    this.meetingService.update(id, data).subscribe({
      next: () => this.router.navigate(['/meetings'], { queryParams: { date: data.date } }),
      error: () => {
        this.submitting.set(false);
        this.errorMsg.set('ذخیره تغییرات با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
        setTimeout(() => this.errorMsg.set(null), 4000);
      },
    });
  }
}

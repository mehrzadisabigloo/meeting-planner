import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Meeting } from '../../../core/models/models';

@Component({
  selector: 'app-meeting-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meeting-card.component.html',
  styleUrl: './meeting-card.component.scss',
})
export class MeetingCardComponent {
  meeting = input.required<Meeting>();
  deleting = input(false);

  edit = output<Meeting>();
  delete = output<Meeting>();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ToastType = 'success' | 'error';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  message = input.required<string>();
  type = input<ToastType>('success');
}

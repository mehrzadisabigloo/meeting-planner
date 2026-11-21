import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
  effect,
} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  title = input('تأیید عملیات');
  message = input('آیا مطمئن هستید؟');
  confirmLabel = input('تأیید');
  loading = input(false);

  confirmed = output<void>();
  cancelled = output<void>();

  readonly dialogTitleId = `dialog-title-${Math.random().toString(36).slice(2)}`;

  private readonly cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      this.cancelBtn()?.nativeElement.focus();
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.host.nativeElement.firstElementChild) {
      this.cancelled.emit();
    }
  }
}

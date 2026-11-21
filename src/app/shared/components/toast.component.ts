import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ToastType = 'success' | 'error';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast toast--{{ type() }}" role="alert" aria-live="polite">
      {{ message() }}
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: var(--space-6);
      left: 50%;
      transform: translateX(-50%);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-lg);
      font-size: var(--font-size-sm);
      font-weight: 500;
      z-index: 300;
      box-shadow: var(--shadow-lg);
      animation: slide-up 0.2s ease;
    }
    .toast--success { background: var(--color-success); color: #fff; }
    .toast--error   { background: var(--color-danger);  color: #fff; }
    @keyframes slide-up {
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `],
})
export class ToastComponent {
  message = input.required<string>();
  type = input<ToastType>('success');
}

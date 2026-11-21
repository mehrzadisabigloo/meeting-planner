import { CanDeactivateFn } from '@angular/router';

export interface CanDeactivateComponent {
  isDirty: boolean;
  confirmDeactivate(): Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => {
  if (component.isDirty) {
    return component.confirmDeactivate();
  }
  return true;
};

import { Routes } from '@angular/router';
import { meetingResolver } from './pages/meeting-edit/meeting.resolver';
import { unsavedChangesGuard } from './pages/meeting-edit/unsaved-changes.guard';

export const meetingRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/meetings-list/meetings-list.component').then(
        (m) => m.MeetingsListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/meeting-create/meeting-create.component').then(
        (m) => m.MeetingCreateComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/meeting-edit/meeting-edit.component').then(
        (m) => m.MeetingEditComponent,
      ),
    resolve: { meeting: meetingResolver },
    canDeactivate: [unsavedChangesGuard],
  },
];

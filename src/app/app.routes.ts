import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'meetings', pathMatch: 'full' },
  {
    path: 'meetings',
    loadChildren: () =>
      import('./features/meetings/meetings.routes').then((m) => m.meetingRoutes),
  },
  { path: '**', redirectTo: 'meetings' },
];

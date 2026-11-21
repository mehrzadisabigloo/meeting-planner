import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { Meeting } from '../../../../core/models/models';
import { MeetingService } from '../../../../core/data-access/meeting.service';

export const meetingResolver: ResolveFn<Meeting> = (route) => {
  const meetingService = inject(MeetingService);
  const router = inject(Router);
  const id = route.paramMap.get('id')!;

  return meetingService.getById(id).pipe(
    catchError(() => {
      router.navigate(['/meetings']);
      return EMPTY;
    }),
  );
};

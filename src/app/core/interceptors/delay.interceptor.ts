import { HttpInterceptorFn } from '@angular/common/http';
import { delay } from 'rxjs/operators';

/** Adds an artificial delay to all API requests to make loading states visible. */
export const delayInterceptor: HttpInterceptorFn = (req, next) => {
  const ms = 400 + Math.random() * 300; // 400–700 ms
  return next(req).pipe(delay(ms));
};

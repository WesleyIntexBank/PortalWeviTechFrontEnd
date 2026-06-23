import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const PUBLIC_PATHS: string[] = [];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isPublic = PUBLIC_PATHS.some(path => req.url.includes(path));

  const authReq = (token && !isPublic)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!isPublic && err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};

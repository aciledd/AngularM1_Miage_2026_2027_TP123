import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

/** Adds the bearer token to protected API requests. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth= inject(AuthService);//service gardé pour appeler logout()

  const router= inject(Router); //redirection vers login
  const token = auth.token(); //on passe par la variable auth

  return next(
    token
      ? request.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        })
      : request,).pipe(catchError((error: HttpErrorResponse)=>{

        //erreur 401 apparait si token vieux ou incorrect
        if(error.status === 401 && token){

          auth.logout(); //efface le token et le user 
          router.navigate(['/login']); //revient à la page de login
        }
        return throwError(() => error);
      }),
  );
};

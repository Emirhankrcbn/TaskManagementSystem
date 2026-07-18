import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // AuthService'i içeri alıyoruz
  const authService = inject(AuthService);
  
  // LocalStorage'daki token'ı çekiyoruz
  const token = authService.getToken();

  // Eğer token varsa, giden isteği klonlayıp içine Authorization header'ını ekliyoruz
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    // İstediği yeni (token'lı) haliyle yoluna devam ediyo
    return next(clonedReq);
  }

  // Token yoksa (örneğin henüz login olunmamışsa), isteği olduğu gibi bırakıyor
  return next(req);
};
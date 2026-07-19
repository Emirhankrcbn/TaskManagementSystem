import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Kullanıcının token'ı varsa (giriş yapmışsa) sayfa geçişine izin ver
  if (authService.isLoggedIn()) {
    return true;
  }

  // Giriş yapmamışsa onu zorla Login sayfasına yönlendir ve erişimi engelle
  router.navigate(['/login']);
  return false;
};
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

// Rotalar lazy-load ediliyor (loadComponent) ki ilk açılışta tek bir dev main.js yerine
// her sayfa kendi parçasında (chunk) indirilsin - production bundle boyutu limitini aşmamak için gerekli
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/tasks').then(m => m.Tasks),
    canActivate: [authGuard]
  },
  // Profil URL'si ve güvenlik duvarı
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/categories').then(m => m.CategoriesComponent),
    canActivate: [authGuard]
  },
];

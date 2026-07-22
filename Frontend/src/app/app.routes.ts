import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Tasks } from './features/tasks/tasks';
import { authGuard } from './core/guards/auth-guard'; 
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { CategoriesComponent } from './features/categories/categories';

// Profil bileşenini import ediyoruz
import { Profile } from './features/profile/profile'; 

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard] 
  },
  { 
    path: 'tasks', 
    component: Tasks,
    canActivate: [authGuard] 
  },
  // Profil URL'si ve güvenlik duvarı
  { 
    path: 'profile', 
    component: Profile,
    canActivate: [authGuard] 
  },
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  { 
    path: 'categories', 
    component: CategoriesComponent 
  },
  
];
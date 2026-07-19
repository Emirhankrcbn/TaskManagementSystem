import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Tasks } from './features/tasks/tasks';
import { authGuard } from './core/guards/auth-guard'; // Guard'ı import ettim
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

export const routes: Routes = [
  // { path: 'login', component: LoginComponent },
  // { path: 'register', component: RegisterComponent },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard] // Güvenlik duvarını Dashboard'a ekledim
  },
  { 
    path: 'tasks', 
    component: Tasks,
    canActivate: [authGuard] // Güvenlik duvarını Tasks'a ekledim
  },

  { path: 'login', component: Login },
  { path: 'register', component: Register }
];
import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Tasks } from './features/tasks/tasks';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'tasks', component: Tasks }
];
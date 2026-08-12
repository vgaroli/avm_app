import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'inscricao',
    loadComponent: () => import('./pages/inscricao/inscricao.component').then((m) => m.InscricaoComponent),
  },
  {
    path: 'admin/pessoas',
    loadComponent: () => import('./pages/admin/pessoas/admin-pessoas.component').then((m) => m.AdminPessoasComponent),
    canActivate: [authGuard, roleGuard('diretoria')],
  },
  {
    path: 'admin/cards',
    loadComponent: () => import('./pages/admin/cards/admin-cards.component').then((m) => m.AdminCardsComponent),
    canActivate: [authGuard, roleGuard('diretoria')],
  },
];

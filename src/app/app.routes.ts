import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { statusAtivoGuard } from './core/guards/status-ativo.guard';
import { senhaProvisoriaGuard } from './core/guards/senha-provisoria.guard';
import { podeRegistrarArvoresGuard } from './core/guards/pode-registrar-arvores.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [senhaProvisoriaGuard] },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'inscricao',
    loadComponent: () => import('./pages/inscricao/inscricao.component').then((m) => m.InscricaoComponent),
  },
  {
    path: 'amigo/:token',
    loadComponent: () =>
      import('./pages/amigos-do-bairro/publico/amigo-publico.component').then((m) => m.AmigoPublicoComponent),
  },
  {
    path: 'amigos-do-bairro/beneficios',
    loadComponent: () =>
      import('./pages/amigos-do-bairro/beneficios/amigos-do-bairro-beneficios.component').then(
        (m) => m.AmigosDoBairroBeneficiosComponent,
      ),
  },
  {
    path: 'amigos-do-bairro',
    loadComponent: () =>
      import('./pages/amigos-do-bairro/lista/amigos-do-bairro-lista.component').then(
        (m) => m.AmigosDoBairroListaComponent,
      ),
  },
  {
    path: 'trocar-senha',
    loadComponent: () => import('./pages/trocar-senha/trocar-senha.component').then((m) => m.TrocarSenhaComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin/pessoas',
    loadComponent: () => import('./pages/admin/pessoas/admin-pessoas.component').then((m) => m.AdminPessoasComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'admin/cards',
    loadComponent: () => import('./pages/admin/cards/admin-cards.component').then((m) => m.AdminCardsComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'agenda',
    loadComponent: () => import('./pages/agenda/agenda.component').then((m) => m.AgendaComponent),
    canActivate: [authGuard, senhaProvisoriaGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent),
    canActivate: [authGuard, senhaProvisoriaGuard],
  },
  {
    path: 'mensagens/nova',
    loadComponent: () => import('./pages/mensagens/nova/nova-mensagem.component').then((m) => m.NovaMensagemComponent),
    canActivate: [authGuard, senhaProvisoriaGuard],
  },
  {
    path: 'mensagens',
    loadComponent: () => import('./pages/mensagens/minhas/minhas-mensagens.component').then((m) => m.MinhasMensagensComponent),
    canActivate: [authGuard, senhaProvisoriaGuard],
  },
  {
    path: 'admin/mensagens',
    loadComponent: () => import('./pages/admin/mensagens/admin-mensagens.component').then((m) => m.AdminMensagensComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'admin/mensagens/:id',
    loadComponent: () => import('./pages/admin/mensagens/mensagem-detalhe.component').then((m) => m.MensagemDetalheComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'credencial',
    loadComponent: () => import('./pages/credencial/credencial.component').then((m) => m.CredencialComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, statusAtivoGuard],
  },
  {
    path: 'validar-credencial',
    loadComponent: () =>
      import('./pages/validar-credencial/validar-credencial.component').then((m) => m.ValidarCredencialComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard(['parceiro', 'diretoria'])],
  },
  {
    path: 'arvores/nova',
    loadComponent: () => import('./pages/arvores/nova/arvore-nova.component').then((m) => m.ArvoreNovaComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, podeRegistrarArvoresGuard],
  },
  {
    path: 'arvores/:id/editar',
    loadComponent: () => import('./pages/arvores/editar/arvore-editar.component').then((m) => m.ArvoreEditarComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'arvores/:id/moderar',
    loadComponent: () => import('./pages/arvores/moderar/arvore-moderar.component').then((m) => m.ArvoreModerarComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'arvores/mapa',
    loadComponent: () => import('./pages/arvores/lista/arvore-lista.component').then((m) => m.ArvoreListaComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
    data: { modoMapa: true },
  },
  {
    path: 'arvores',
    loadComponent: () => import('./pages/arvores/lista/arvore-lista.component').then((m) => m.ArvoreListaComponent),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'admin/estabelecimentos/novo',
    loadComponent: () =>
      import('./pages/admin/estabelecimentos/novo/estabelecimento-novo.component').then(
        (m) => m.EstabelecimentoNovoComponent,
      ),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'admin/estabelecimentos/:id',
    loadComponent: () =>
      import('./pages/admin/estabelecimentos/detalhe/estabelecimento-detalhe.component').then(
        (m) => m.EstabelecimentoDetalheComponent,
      ),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
  {
    path: 'admin/estabelecimentos',
    loadComponent: () =>
      import('./pages/admin/estabelecimentos/lista/admin-estabelecimentos.component').then(
        (m) => m.AdminEstabelecimentosComponent,
      ),
    canActivate: [authGuard, senhaProvisoriaGuard, roleGuard('diretoria')],
  },
];

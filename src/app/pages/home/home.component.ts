import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

interface CardInfo {
  icon: string;
  title: string;
  info: string;
  colorClass: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  userName = 'João Silva';
  userProfilePic = 'assets/mock-profile.jpg';
  
  nextEvent = {
    title: 'Assembleia Geral Ordinária',
    date: '15 de Out, 19:30',
    location: 'Sede da AVM'
  };

  cards: CardInfo[] = [
    { icon: 'people', title: 'Associados', info: '24 associados ativos', colorClass: 'card-primary' },
    { icon: 'gavel', title: 'Processos', info: '7 processos em acompanhamento', colorClass: 'card-accent' },
    { icon: 'account_tree', title: 'Projetos', info: '2 projetos em andamento', colorClass: 'card-info' },
    { icon: 'event', title: 'Agenda', info: '3 eventos nesta semana', colorClass: 'card-warning' },
    { icon: 'store', title: 'Estabelecimentos', info: '5 estabelecimentos em análise', colorClass: 'card-success' },
    { icon: 'campaign', title: 'Comunicados', info: '2 novos avisos', colorClass: 'card-danger' },
    { icon: 'description', title: 'Documentos', info: '12 documentos recentes', colorClass: 'card-secondary' },
  ];
}

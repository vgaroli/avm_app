import { Evento } from '../models/evento.model';

export function formatarDataEvento(evento: Evento): string {
  const data = new Date(evento.inicio);
  const opcoes: Intl.DateTimeFormatOptions = evento.diaTodo
    ? { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }
    : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Intl.DateTimeFormat('pt-BR', opcoes).format(data);
}

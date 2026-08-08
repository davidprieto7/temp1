import type { Evento } from '../types/evento';
import { CATEGORIA_LABELS, ESTADO_LABELS } from '../types/evento';
import { horaFin } from './timeEngine';

function escaparCsv(valor: string): string {
  if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/** Genera CSV del rundown y dispara descarga en el navegador. */
export function exportarEventoCsv(evento: Evento): void {
  const headers = [
    'Orden',
    'Nombre',
    'Inicio',
    'Fin',
    'Duracion (min)',
    'Responsable',
    'Categoria',
    'Estado',
    'Notas',
  ];

  const filas = evento.actividades.map((act, i) =>
    [
      String(i + 1),
      act.nombre,
      act.horaInicio,
      horaFin(act.horaInicio, act.duracionMinutos),
      String(act.duracionMinutos),
      act.responsable ?? '',
      act.categoria ? CATEGORIA_LABELS[act.categoria] : '',
      ESTADO_LABELS[act.estado],
      act.notas ?? '',
    ]
      .map(escaparCsv)
      .join(','),
  );

  const csv = [headers.join(','), ...filas].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = evento.nombre.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/gi, '').trim() || 'rundown';
  a.href = url;
  a.download = `${safeName}-${evento.fecha}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

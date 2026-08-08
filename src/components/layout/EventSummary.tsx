import type { Evento } from '../../types/evento';
import {
  detectarHuecosYSolapes,
  diferenciaConCierre,
  duracionTotal,
  formatearDuracion,
  formatearFechaLarga,
  horaFin,
  parseFechaEvento,
} from '../../lib/timeEngine';

export function EventSummary({
  evento,
  compact = false,
}: {
  evento: Evento;
  compact?: boolean;
}) {
  const total = duracionTotal(evento.actividades);
  const base = parseFechaEvento(evento.fecha);
  const diff = diferenciaConCierre(evento.actividades, evento.horaCierrePlaneada, base);
  const issues = detectarHuecosYSolapes(evento.actividades, base);
  const fin =
    evento.actividades.length > 0
      ? horaFin(evento.actividades[0].horaInicio, total, base)
      : '—';

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[var(--color-text-muted)] sm:text-xs">
        <span className="hidden capitalize sm:inline">
          {formatearFechaLarga(evento.fecha)}
        </span>
        <span>
          {formatearDuracion(total)}
          {fin !== '—' && <> · fin {fin}</>}
        </span>
        {issues.length > 0 && (
          <span className="font-medium text-[var(--color-accent)]">
            {issues.length} aviso{issues.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
      <span className="capitalize">
        <strong className="font-medium text-[var(--color-text)]">
          {formatearFechaLarga(evento.fecha)}
        </strong>
      </span>
      <span>
        Total: <strong className="text-[var(--color-text)]">{formatearDuracion(total)}</strong>
      </span>
      <span>
        Fin estimado: <strong className="text-[var(--color-text)]">{fin}</strong>
      </span>
      {evento.horaCierrePlaneada && (
        <span>
          Cierre planeado:{' '}
          <strong className="text-[var(--color-text)]">{evento.horaCierrePlaneada}</strong>
          {diff !== null && diff !== 0 && (
            <span className="ml-1 text-[var(--color-accent)]">
              ({diff > 0 ? `+${diff}` : diff} min)
            </span>
          )}
        </span>
      )}
      {issues.length > 0 && (
        <span className="font-medium text-[var(--color-accent)]">
          {issues.length} aviso{issues.length > 1 ? 's' : ''} de hueco/solape
        </span>
      )}
    </div>
  );
}

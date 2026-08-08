import type { EstadoActividad, Categoria } from '../../types/evento';
import { ESTADO_LABELS, CATEGORIA_LABELS } from '../../types/evento';

/** Badges de estado: un solo azul, distinta intensidad por momento. */
const estadoCls: Record<EstadoActividad, string> = {
  pendiente:
    'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
  en_curso: 'bg-[var(--color-accent)] text-white',
  finalizada: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
};

export function EstadoBadge({ estado }: { estado: EstadoActividad }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight ${estadoCls[estado]}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}

export function CategoriaBadge({ categoria }: { categoria?: Categoria }) {
  if (!categoria) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-[11px] font-medium tracking-tight text-[var(--color-accent)]">
      {CATEGORIA_LABELS[categoria]}
    </span>
  );
}

/** Fondo del bloque según estado — siempre azul, distinta saturación. */
export function estadoBlockClass(estado: EstadoActividad): string {
  switch (estado) {
    case 'en_curso':
      return 'bg-[var(--color-block-active)]';
    case 'finalizada':
      return 'bg-[var(--color-block-done)]';
    default:
      return 'bg-[var(--color-block)]';
  }
}

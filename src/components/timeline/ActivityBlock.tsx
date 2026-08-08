import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import type { EventoActividad, HuecoOSolape } from '../../types/evento';
import { formatearDuracion, horaFin } from '../../lib/timeEngine';
import { useEventoStore } from '../../store/eventoStore';
import { CategoriaBadge, EstadoBadge, estadoBlockClass } from '../ui/Badges';
import { Button } from '../ui/Button';

const PX_POR_MINUTO = 2.2;
/** Altura mínima para que siempre quepan título + hora + duración. */
const MIN_ALTURA = 96;

/** Altura objetivo del bloque (proporcional a duración, con piso usable). */
export function alturaBloque(duracionMinutos: number): number {
  return Math.max(MIN_ALTURA, duracionMinutos * PX_POR_MINUTO);
}

interface ActivityBlockProps {
  actividad: EventoActividad;
  issue?: HuecoOSolape;
  isNow?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onInsertAfter: () => void;
}

export function ActivityBlock({
  actividad,
  issue,
  isNow,
  onEdit,
  onDelete,
  onInsertAfter,
}: ActivityBlockProps) {
  const liveActivo = useEventoStore((s) => s.liveActivo);
  // Fuera del live no mostramos “finalizada” por el reloj
  const estado = liveActivo ? actividad.estado : 'pendiente';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: actividad.id,
  });

  const fin = horaFin(actividad.horaInicio, actividad.duracionMinutos);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    minHeight: alturaBloque(actividad.duracionMinutos),
  };

  return (
    <div className="group/block relative">
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex rounded-2xl border border-[var(--color-border)]/80 ${estadoBlockClass(estado)} ${
          isDragging ? 'opacity-80 z-10 shadow-lg' : 'shadow-sm'
        } ${isNow && liveActivo ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-surface-muted)]' : ''} ${
          estado === 'finalizada' ? 'opacity-55' : ''
        }`}
      >
        <div
          className={`w-1 shrink-0 self-stretch rounded-l-2xl ${
            estado === 'en_curso'
              ? 'bg-[var(--color-accent)]'
              : estado === 'finalizada'
                ? 'bg-[var(--color-accent-muted)]'
                : 'bg-[var(--color-accent-muted)]/60'
          }`}
          aria-hidden
        />
        <button
          type="button"
          className="flex w-7 shrink-0 touch-none cursor-grab items-center justify-center text-[var(--color-text-muted)] active:cursor-grabbing sm:w-8"
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-2.5 sm:p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-sm font-semibold leading-snug sm:text-base">
                  {actividad.nombre}
                </h3>
                <EstadoBadge estado={estado} />
                <CategoriaBadge categoria={actividad.categoria} />
              </div>
              {actividad.responsable && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {actividad.responsable}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Editar">
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Eliminar">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums">
            <span className="font-semibold text-[var(--color-text)]">
              {actividad.horaInicio} – {fin}
            </span>
            <span className="rounded-full bg-[var(--color-surface)]/70 px-2 py-0.5 font-medium text-[var(--color-text-muted)]">
              {formatearDuracion(actividad.duracionMinutos)}
            </span>
          </div>
        </div>
      </div>

      {issue && (
        <div className="my-1.5 rounded-xl border border-[var(--color-accent-muted)] bg-[var(--color-accent-soft)] px-3 py-1.5 text-xs text-[var(--color-accent)]">
          {issue.tipo === 'hueco'
            ? `Hueco de ${issue.minutos} min antes de la siguiente`
            : `Solape de ${issue.minutos} min con la siguiente`}
        </div>
      )}

      <div className="flex justify-center py-1 opacity-100 transition md:py-0.5 md:opacity-0 md:group-hover/block:opacity-100 md:focus-within:opacity-100">
        <button
          type="button"
          onClick={onInsertAfter}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[10px] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <Plus size={10} />
          Insertar
        </button>
      </div>
    </div>
  );
}

export { PX_POR_MINUTO };

import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { useEventoStore } from '../../store/eventoStore';
import {
  detectarHuecosYSolapes,
  diferenciaConCierre,
  parseFechaEvento,
  parseHora,
  relacionDiaEvento,
} from '../../lib/timeEngine';
import { differenceInMinutes } from 'date-fns';
import { ActivityBlock, PX_POR_MINUTO, alturaBloque } from './ActivityBlock';
import { Modal } from '../ui/Modal';
import { ActivityForm } from '../forms/ActivityForm';
import type { EventoActividad } from '../../types/evento';
import { horaFin } from '../../lib/timeEngine';

export function TimelineView() {
  const evento = useEventoStore((s) => s.getEventoActivo());
  const liveActivo = useEventoStore((s) => s.liveActivo);
  const nowTick = useEventoStore((s) => s.nowTick);
  const reordenarActividades = useEventoStore((s) => s.reordenarActividades);
  const actualizarActividad = useEventoStore((s) => s.actualizarActividad);
  const eliminarActividad = useEventoStore((s) => s.eliminarActividad);
  const agregarActividad = useEventoStore((s) => s.agregarActividad);

  const [editando, setEditando] = useState<EventoActividad | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const issues = useMemo(
    () => (evento ? detectarHuecosYSolapes(evento.actividades) : []),
    [evento],
  );

  const issueByAfterId = useMemo(() => {
    const map = new Map<string, (typeof issues)[0]>();
    for (const issue of issues) {
      map.set(issue.entreIds[0], issue);
    }
    return map;
  }, [issues]);

  const nowLineTop = useMemo(() => {
    if (!evento || evento.actividades.length === 0) return null;
    const now = new Date(nowTick);
    // La línea "ahora" solo tiene sentido el día del evento
    if (relacionDiaEvento(evento.fecha, now) !== 'hoy') return null;
    const primera = evento.actividades[0];
    const inicio = parseHora(primera.horaInicio, parseFechaEvento(evento.fecha));
    const mins = differenceInMinutes(now, inicio);
    if (mins < -5) return null;
    return Math.max(0, mins * PX_POR_MINUTO);
  }, [evento, nowTick]);

  if (!evento) {
    return (
      <p className="text-center text-sm text-[var(--color-text-muted)]">Seleccioná un evento</p>
    );
  }

  if (evento.actividades.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          Este evento no tiene actividades. Agregá la primera para armar el rundown.
        </p>
      </div>
    );
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = evento.actividades.findIndex((a) => a.id === active.id);
    const to = evento.actividades.findIndex((a) => a.id === over.id);
    if (from === -1 || to === -1) return;
    reordenarActividades(from, to);
  };

  const ids = evento.actividades.map((a) => a.id);
  const diffCierre = diferenciaConCierre(evento.actividades, evento.horaCierrePlaneada);

  const defaultInsertHora =
    insertIndex !== null && insertIndex > 0
      ? horaFin(
          evento.actividades[insertIndex - 1].horaInicio,
          evento.actividades[insertIndex - 1].duracionMinutos,
        )
      : evento.actividades[0]?.horaInicio ?? '09:00';

  return (
    <div className="mx-auto w-full max-w-2xl px-0">
      {diffCierre !== null && Math.abs(diffCierre) > 0 && (
        <div className="mb-3 rounded-2xl border border-[var(--color-accent-muted)] bg-[var(--color-accent-soft)] px-3 py-2.5 text-xs text-[var(--color-accent)] sm:mb-4 sm:px-4 sm:py-3 sm:text-sm">
          {diffCierre > 0
            ? `El rundown se pasa ${diffCierre} min del cierre planeado (${evento.horaCierrePlaneada}).`
            : `El rundown termina ${Math.abs(diffCierre)} min antes del cierre planeado.`}
        </div>
      )}

      <div className="relative pl-11 sm:pl-14">
        {/* Columna de horas */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-10 sm:w-12">
          {evento.actividades.map((act) => (
            <div
              key={`hora-${act.id}`}
              className="text-right text-[10px] font-medium tabular-nums text-[var(--color-text-muted)] sm:text-xs"
              style={{
                minHeight: alturaBloque(act.duracionMinutos) + 24,
              }}
            >
              {act.horaInicio}
            </div>
          ))}
        </div>

        {/* Línea "ahora" */}
        {nowLineTop !== null && (
          <div
            className="pointer-events-none absolute left-8 right-0 z-20 flex items-center sm:left-10"
            style={{ top: nowLineTop }}
          >
            <span className="mr-1.5 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
              Ahora
            </span>
            <div className="h-0.5 flex-1 bg-[var(--color-accent)]" />
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0">
              {evento.actividades.map((act, index) => (
                <ActivityBlock
                  key={act.id}
                  actividad={act}
                  issue={issueByAfterId.get(act.id)}
                  isNow={liveActivo && act.estado === 'en_curso'}
                  onEdit={() => setEditando(act)}
                  onDelete={() => {
                    if (confirm(`¿Eliminar «${act.nombre}»?`)) {
                      eliminarActividad(act.id);
                      toast.message('Actividad eliminada');
                    }
                  }}
                  onInsertAfter={() => setInsertIndex(index + 1)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Modal open={!!editando} title="Editar actividad" onClose={() => setEditando(null)}>
        {editando && (
          <ActivityForm
            initial={editando}
            submitLabel="Guardar"
            onCancel={() => setEditando(null)}
            onSubmit={(data) => {
              actualizarActividad(editando.id, data);
              setEditando(null);
              toast.success('Actividad actualizada');
            }}
          />
        )}
      </Modal>

      <Modal
        open={insertIndex !== null}
        title="Insertar actividad"
        onClose={() => setInsertIndex(null)}
      >
        {insertIndex !== null && (
          <ActivityForm
            defaultHoraInicio={defaultInsertHora}
            submitLabel="Insertar"
            onCancel={() => setInsertIndex(null)}
            onSubmit={(data) => {
              agregarActividad(data, insertIndex);
              setInsertIndex(null);
              toast.success('Actividad insertada');
            }}
          />
        )}
      </Modal>
    </div>
  );
}

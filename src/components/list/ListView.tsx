import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEventoStore } from '../../store/eventoStore';
import { formatearDuracion, horaFin } from '../../lib/timeEngine';
import { CategoriaBadge, EstadoBadge } from '../ui/Badges';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ActivityForm } from '../forms/ActivityForm';
import type { EventoActividad } from '../../types/evento';

export function ListView() {
  const evento = useEventoStore((s) => s.getEventoActivo());
  const liveActivo = useEventoStore((s) => s.liveActivo);
  const actualizarActividad = useEventoStore((s) => s.actualizarActividad);
  const eliminarActividad = useEventoStore((s) => s.eliminarActividad);
  const agregarActividad = useEventoStore((s) => s.agregarActividad);

  const [editando, setEditando] = useState<EventoActividad | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  if (!evento) {
    return (
      <p className="text-center text-sm text-[var(--color-text-muted)]">Seleccioná un evento</p>
    );
  }

  const defaultInsertHora =
    insertIndex !== null && insertIndex > 0
      ? horaFin(
          evento.actividades[insertIndex - 1].horaInicio,
          evento.actividades[insertIndex - 1].duracionMinutos,
        )
      : (evento.actividades[0]?.horaInicio ?? '09:00');

  const acciones = (act: EventoActividad, index: number) => (
    <div className="flex justify-end gap-0.5">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setInsertIndex(index + 1)}
        title="Insertar debajo"
        aria-label="Insertar"
      >
        <Plus size={14} />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setEditando(act)}
        aria-label="Editar"
      >
        <Pencil size={14} />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          if (confirm(`¿Eliminar «${act.nombre}»?`)) {
            eliminarActividad(act.id);
            toast.message('Actividad eliminada');
          }
        }}
        aria-label="Eliminar"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Cards en móvil */}
      <div className="flex flex-col gap-2 md:hidden">
        {evento.actividades.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
            Sin actividades. Agregá una desde el encabezado.
          </p>
        )}
        {evento.actividades.map((act, index) => {
          const estado = liveActivo ? act.estado : 'pendiente';
          return (
            <article
              key={act.id}
              className={`rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3.5 shadow-sm ${
                estado === 'en_curso' ? 'ring-2 ring-[var(--color-accent)]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--color-text-muted)]">#{index + 1}</p>
                  <h3 className="text-sm font-semibold leading-snug">{act.nombre}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <CategoriaBadge categoria={act.categoria} />
                    <EstadoBadge estado={estado} />
                  </div>
                </div>
                {acciones(act, index)}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text)]">
                  {act.horaInicio} – {horaFin(act.horaInicio, act.duracionMinutos)}
                </span>
                <span>{formatearDuracion(act.duracionMinutos)}</span>
                {act.responsable && <span>{act.responsable}</span>}
              </div>
            </article>
          );
        })}
      </div>

      {/* Tabla en tablet/desktop */}
      <div className="hidden overflow-x-auto rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-sm md:block">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]/60 text-left text-xs tracking-wide text-[var(--color-text-muted)]">
              <th className="px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Actividad</th>
              <th className="px-3 py-2.5 font-medium">Inicio</th>
              <th className="px-3 py-2.5 font-medium">Fin</th>
              <th className="px-3 py-2.5 font-medium">Duración</th>
              <th className="px-3 py-2.5 font-medium">Responsable</th>
              <th className="px-3 py-2.5 font-medium">Estado</th>
              <th className="px-3 py-2.5 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {evento.actividades.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[var(--color-text-muted)]">
                  Sin actividades. Agregá una desde el encabezado.
                </td>
              </tr>
            )}
            {evento.actividades.map((act, index) => {
              const estado = liveActivo ? act.estado : 'pendiente';
              return (
                <tr
                  key={act.id}
                  className={`border-b border-[var(--color-border)]/60 last:border-0 ${
                    estado === 'en_curso' ? 'bg-[var(--color-accent-soft)]' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{act.nombre}</div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      <CategoriaBadge categoria={act.categoria} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">{act.horaInicio}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {horaFin(act.horaInicio, act.duracionMinutos)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatearDuracion(act.duracionMinutos)}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--color-text-muted)]">
                    {act.responsable || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <EstadoBadge estado={estado} />
                  </td>
                  <td className="px-3 py-2.5">{acciones(act, index)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!editando} title="Editar actividad" onClose={() => setEditando(null)}>
        {editando && (
          <ActivityForm
            initial={editando}
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

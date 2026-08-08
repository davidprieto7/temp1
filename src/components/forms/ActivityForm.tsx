import { useState, type FormEvent } from 'react';
import type { Categoria, EventoActividad } from '../../types/evento';
import { CATEGORIA_LABELS } from '../../types/evento';
import type { ActivityInput } from '../../store/eventoStore';
import { Button } from '../ui/Button';

interface ActivityFormProps {
  initial?: Partial<EventoActividad>;
  defaultHoraInicio?: string;
  submitLabel?: string;
  onSubmit: (data: ActivityInput) => void;
  onCancel: () => void;
}

const categorias = Object.keys(CATEGORIA_LABELS) as Categoria[];

export function ActivityForm({
  initial,
  defaultHoraInicio = '09:00',
  submitLabel = 'Guardar',
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [horaInicio, setHoraInicio] = useState(initial?.horaInicio ?? defaultHoraInicio);
  const [duracion, setDuracion] = useState(initial?.duracionMinutos ?? 15);
  const [responsable, setResponsable] = useState(initial?.responsable ?? '');
  const [notas, setNotas] = useState(initial?.notas ?? '');
  const [categoria, setCategoria] = useState<Categoria | ''>(initial?.categoria ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || duracion < 1) return;
    onSubmit({
      nombre: nombre.trim(),
      horaInicio,
      duracionMinutos: Number(duracion),
      responsable: responsable.trim() || undefined,
      notas: notas.trim() || undefined,
      categoria: categoria || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nombre de la actividad</span>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          placeholder="Ej. Keynote de apertura"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Hora de inicio</span>
          <input
            type="time"
            required
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            Si no es la primera, se recalculará en cascada
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Duración (min)</span>
          <input
            type="number"
            min={1}
            required
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Responsable (opcional)</span>
        <input
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          placeholder="Nombre"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Categoría</span>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Categoria | '')}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        >
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Notas (opcional)</span>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          placeholder="Instrucciones, cues, etc."
        />
      </label>

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

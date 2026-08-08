import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';

interface EventoFormProps {
  initial?: { nombre: string; fecha: string; horaCierrePlaneada?: string };
  submitLabel?: string;
  onSubmit: (data: { nombre: string; fecha: string; horaCierrePlaneada?: string }) => void;
  onCancel: () => void;
}

export function EventoForm({ initial, submitLabel = 'Guardar', onSubmit, onCancel }: EventoFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [fecha, setFecha] = useState(initial?.fecha ?? new Date().toISOString().slice(0, 10));
  const [horaCierre, setHoraCierre] = useState(initial?.horaCierrePlaneada ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSubmit({
      nombre: nombre.trim(),
      fecha,
      horaCierrePlaneada: horaCierre || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nombre del evento</span>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          placeholder="Ej. Conferencia anual"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fecha</span>
        <input
          type="date"
          required
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Hora de cierre planeada (opcional)</span>
        <input
          type="time"
          value={horaCierre}
          onChange={(e) => setHoraCierre(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
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

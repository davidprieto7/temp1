import { addMinutes } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useEventoStore } from '../../store/eventoStore';
import { useNow } from '../../hooks/useNow';
import {
  actividadActualYProxima,
  formatHora,
  formatearDuracion,
  formatearFechaLarga,
  horaFin,
  parseFechaEvento,
  parseHora,
  relacionDiaEvento,
} from '../../lib/timeEngine';
import { decodeEventoShare, extractShareFromHash } from '../../lib/shareEvento';
import type { EstadoActividad, Evento, EventoActividad } from '../../types/evento';
import { CategoriaBadge, EstadoBadge, estadoBlockClass } from '../ui/Badges';
import { Button } from '../ui/Button';

function estadoVisual(
  actId: string,
  actualId: string | null,
  finAct: Date,
  now: Date,
  diaHoy: boolean,
): EstadoActividad {
  if (!diaHoy) return 'pendiente';
  if (actId === actualId) return 'en_curso';
  if (now >= finAct) return 'finalizada';
  return 'pendiente';
}

function accentBarClass(estado: EstadoActividad): string {
  if (estado === 'en_curso') return 'bg-[var(--color-accent)]';
  if (estado === 'finalizada') return 'bg-[var(--color-accent-muted)]';
  return 'bg-[var(--color-accent-muted)]/60';
}

/** Tarjeta de actividad con el mismo lenguaje visual que el admin. */
function PublicActivityCard({
  actividad,
  estado,
  featured = false,
  progress,
  minutosRestantes,
  eyebrow,
}: {
  actividad: EventoActividad;
  estado: EstadoActividad;
  featured?: boolean;
  progress?: number;
  minutosRestantes?: number | null;
  eyebrow?: string;
}) {
  const fin = horaFin(actividad.horaInicio, actividad.duracionMinutos);

  return (
    <article
      className={`flex rounded-2xl border border-[var(--color-border)]/80 shadow-sm ${estadoBlockClass(estado)} ${
        estado === 'en_curso'
          ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-surface-muted)]'
          : ''
      } ${estado === 'finalizada' ? 'opacity-55' : ''}`}
    >
      <div
        className={`w-1 shrink-0 self-stretch rounded-l-2xl ${accentBarClass(estado)}`}
        aria-hidden
      />
      <div
        className={`flex min-w-0 flex-1 flex-col justify-between gap-2 ${
          featured ? 'p-4 sm:p-5' : 'p-2.5 sm:p-3.5'
        }`}
      >
        {eyebrow && (
          <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">{eyebrow}</p>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3
              className={`font-semibold leading-snug ${
                featured ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
              }`}
            >
              {actividad.nombre}
            </h3>
            <EstadoBadge estado={estado} />
            <CategoriaBadge categoria={actividad.categoria} />
          </div>
          {actividad.responsable && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
              {actividad.responsable}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums">
          <span className="font-semibold text-[var(--color-text)]">
            {actividad.horaInicio} – {fin}
          </span>
          <span className="rounded-full bg-[var(--color-surface)]/70 px-2 py-0.5 font-medium text-[var(--color-text-muted)]">
            {formatearDuracion(actividad.duracionMinutos)}
          </span>
        </div>

        {featured && progress !== undefined && (
          <div className="mt-1">
            <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>Progreso</span>
              {minutosRestantes != null && (
                <span>Quedan {formatearDuracion(minutosRestantes)}</span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface)]/80">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-1000"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function PublicView() {
  const eventos = useEventoStore((s) => s.eventos);
  const eventoActivoId = useEventoStore((s) => s.eventoActivoId);
  const storeEvento = eventos.find((e) => e.id === eventoActivoId) ?? eventos[0] ?? null;
  const darkMode = useEventoStore((s) => s.darkMode);
  const toggleDarkMode = useEventoStore((s) => s.toggleDarkMode);
  const now = useNow(1000);

  const [shared, setShared] = useState<Evento | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const load = () => {
      const token = extractShareFromHash(window.location.hash);
      if (!token) {
        setShared(null);
        return;
      }
      setShared(decodeEventoShare(token));
    };
    load();
    window.addEventListener('hashchange', load);
    return () => window.removeEventListener('hashchange', load);
  }, []);

  const evento = shared ?? storeEvento;
  const desdeShare = !!shared;

  const base = useMemo(
    () => (evento ? parseFechaEvento(evento.fecha) : new Date()),
    [evento],
  );
  const dia = evento ? relacionDiaEvento(evento.fecha, now) : 'hoy';
  const esHoy = dia === 'hoy';
  const resumen = useMemo(
    () =>
      evento
        ? actividadActualYProxima(evento.actividades, now, base)
        : {
            actual: null,
            proxima: null,
            minutosParaProxima: null,
            progresoActual: 0,
            minutosRestantesActual: null,
          },
    [evento, now, base],
  );

  if (!evento) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[var(--color-surface-muted)] px-4 text-center">
        <p className="text-[var(--color-text-muted)]">No hay un evento para mostrar.</p>
        <Link to="/admin" className="text-[var(--color-accent)] hover:underline">
          Ir a administración
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--color-surface-muted)] text-[var(--color-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)]/60 bg-[var(--color-surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">
              En vivo · público
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {evento.nombre}
            </h1>
            <p className="mt-0.5 text-xs capitalize text-[var(--color-text-muted)] sm:text-sm">
              {formatearFechaLarga(evento.fecha)}
              {desdeShare ? ' · enlace compartido' : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-mono text-sm tabular-nums text-[var(--color-text)] sm:text-base">
              {formatHora(now)}
            </span>
            <Button size="sm" variant="ghost" onClick={toggleDarkMode} aria-label="Tema">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4 pb-10 sm:gap-5 sm:px-6 sm:py-6">
        {dia === 'futuro' && (
          <p className="rounded-2xl border border-[var(--color-accent-muted)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-accent)]">
            El evento es el {formatearFechaLarga(evento.fecha)}. Acá vas a ver el programa completo.
          </p>
        )}

        {/* Destacados: Ahora / Siguiente */}
        {resumen.actual && esHoy && (
          <PublicActivityCard
            actividad={resumen.actual}
            estado="en_curso"
            featured
            eyebrow="Ahora"
            progress={resumen.progresoActual}
            minutosRestantes={resumen.minutosRestantesActual}
          />
        )}

        {(!resumen.actual || !esHoy) && (
          <div className="flex rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-block)] p-4 shadow-sm sm:p-5">
            <div className="w-1 shrink-0 self-stretch rounded-full bg-[var(--color-accent-muted)]/60" />
            <div className="min-w-0 flex-1 pl-3">
              <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">Ahora</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {dia === 'pasado'
                  ? 'El evento ya finalizó.'
                  : dia === 'futuro'
                    ? 'Todavía no comenzó.'
                    : 'No hay un segmento en curso en este momento.'}
              </p>
            </div>
          </div>
        )}

        {resumen.proxima && (
          <PublicActivityCard
            actividad={resumen.proxima}
            estado="pendiente"
            featured
            eyebrow={
              resumen.minutosParaProxima !== null && esHoy
                ? `Siguiente · en ${formatearDuracion(resumen.minutosParaProxima)}`
                : 'Siguiente'
            }
          />
        )}

        {/* Programa: misma estética de tarjetas del timeline admin */}
        <section>
          <h4 className="mb-3 text-xs font-medium tracking-wide text-[var(--color-text-muted)]">
            Programa
          </h4>
          <div className="relative pl-11 sm:pl-14">
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-10 sm:w-12">
              {evento.actividades.map((act) => (
                <div
                  key={`hora-${act.id}`}
                  className="flex items-start justify-end pb-2 text-right text-[10px] font-medium tabular-nums text-[var(--color-text-muted)] sm:text-xs"
                  style={{ minHeight: 88 }}
                >
                  {act.horaInicio}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {evento.actividades.map((act) => {
                const fin = addMinutes(parseHora(act.horaInicio, base), act.duracionMinutos);
                const estado = estadoVisual(
                  act.id,
                  resumen.actual?.id ?? null,
                  fin,
                  now,
                  esHoy,
                );
                return (
                  <PublicActivityCard key={act.id} actividad={act} estado={estado} />
                );
              })}
            </div>
          </div>
        </section>

        <p className="text-center text-[11px] text-[var(--color-text-muted)]">
          Vista para el público ·{' '}
          <Link to="/admin" className="text-[var(--color-accent)] hover:underline">
            Admin
          </Link>
        </p>
      </main>
    </div>
  );
}

import { addMinutes } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Moon, Sun } from 'lucide-react';
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
import type { EstadoActividad, Evento } from '../../types/evento';
import { EstadoBadge, CategoriaBadge } from '../ui/Badges';
import { Button } from '../ui/Button';

function estadoVisual(
  actId: string,
  actualId: string | null,
  finAct: Date,
  now: Date,
): EstadoActividad {
  if (actId === actualId) return 'en_curso';
  if (now >= finAct) return 'finalizada';
  return 'pendiente';
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
          <p className="rounded-2xl bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-accent)]">
            El evento es el {formatearFechaLarga(evento.fecha)}. Acá vas a ver el programa completo.
          </p>
        )}

        {/* Actual */}
        <section className="rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5 shadow-sm sm:p-7">
          <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">Ahora</p>
          {resumen.actual && dia === 'hoy' ? (
            <>
              <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-4xl">
                {resumen.actual.nombre}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <EstadoBadge estado="en_curso" />
                <CategoriaBadge categoria={resumen.actual.categoria} />
              </div>
              {resumen.actual.responsable && (
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {resumen.actual.responsable}
                </p>
              )}
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {resumen.actual.horaInicio} –{' '}
                {formatHora(
                  addMinutes(parseHora(resumen.actual.horaInicio, base), resumen.actual.duracionMinutos),
                )}{' '}
                · {formatearDuracion(resumen.actual.duracionMinutos)}
              </p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Progreso</span>
                  {resumen.minutosRestantesActual !== null && (
                    <span>Quedan {formatearDuracion(resumen.minutosRestantesActual)}</span>
                  )}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-accent-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-1000"
                    style={{ width: `${Math.round(resumen.progresoActual * 100)}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="mt-2 text-[var(--color-text-muted)]">
              {dia === 'pasado'
                ? 'El evento ya finalizó.'
                : dia === 'futuro'
                  ? 'Todavía no comenzó.'
                  : 'No hay un segmento en curso en este momento.'}
            </p>
          )}
        </section>

        {/* Próxima */}
        <section className="rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5 shadow-sm sm:p-7">
          <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">Siguiente</p>
          {resumen.proxima ? (
            <>
              <h3 className="mt-2 text-xl font-semibold sm:text-2xl">{resumen.proxima.nombre}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Clock size={16} />
                  {resumen.proxima.horaInicio}
                </span>
                {resumen.minutosParaProxima !== null && dia === 'hoy' && (
                  <span className="text-[var(--color-text-muted)]">
                    en {formatearDuracion(resumen.minutosParaProxima)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="mt-2 text-[var(--color-text-muted)]">No hay más actividades programadas.</p>
          )}
        </section>

        {/* Programa */}
        <section>
          <h4 className="mb-2 text-xs font-medium tracking-wide text-[var(--color-text-muted)]">
            Programa
          </h4>
          <ul className="overflow-hidden rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-sm">
            {evento.actividades.map((act) => {
              const fin = addMinutes(parseHora(act.horaInicio, base), act.duracionMinutos);
              const estado = estadoVisual(act.id, resumen.actual?.id ?? null, fin, now);
              const isActual = act.id === resumen.actual?.id && dia === 'hoy';
              return (
                <li
                  key={act.id}
                  className={`flex flex-col gap-1 border-b border-[var(--color-border)]/60 px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between ${
                    isActual ? 'bg-[var(--color-accent-soft)]' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{act.nombre}</p>
                    <p className="text-xs tabular-nums text-[var(--color-text-muted)]">
                      {act.horaInicio} – {horaFin(act.horaInicio, act.duracionMinutos)} ·{' '}
                      {formatearDuracion(act.duracionMinutos)}
                      {act.responsable ? ` · ${act.responsable}` : ''}
                    </p>
                  </div>
                  <EstadoBadge estado={dia === 'hoy' ? estado : 'pendiente'} />
                </li>
              );
            })}
          </ul>
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

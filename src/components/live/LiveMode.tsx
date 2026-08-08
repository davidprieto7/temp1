import { addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Radio } from 'lucide-react';
import { useEventoStore } from '../../store/eventoStore';
import {
  actividadActualYProxima,
  formatHora,
  formatearDuracion,
  formatearFechaLarga,
  parseFechaEvento,
  parseHora,
  relacionDiaEvento,
} from '../../lib/timeEngine';
import { ALERTA_MINUTOS } from '../../lib/alertEngine';
import { Button } from '../ui/Button';
import { EstadoBadge, CategoriaBadge } from '../ui/Badges';

export function LiveMode() {
  const evento = useEventoStore((s) => s.getEventoActivo());
  const liveActivo = useEventoStore((s) => s.liveActivo);
  const nowTick = useEventoStore((s) => s.nowTick);
  const iniciarEvento = useEventoStore((s) => s.iniciarEvento);
  const reanclarAHoraActual = useEventoStore((s) => s.reanclarAHoraActual);
  const finalizarActividadAhora = useEventoStore((s) => s.finalizarActividadAhora);
  const actualizarEvento = useEventoStore((s) => s.actualizarEvento);

  if (!evento) {
    return (
      <p className="text-center text-sm text-[var(--color-text-muted)]">Seleccioná un evento</p>
    );
  }

  const now = new Date(nowTick);
  const base = parseFechaEvento(evento.fecha);
  const dia = relacionDiaEvento(evento.fecha, now);
  const resumen = actividadActualYProxima(evento.actividades, now, base);
  const alertaProxima =
    resumen.minutosParaProxima !== null &&
    resumen.minutosParaProxima <= ALERTA_MINUTOS &&
    dia === 'hoy';

  if (!liveActivo) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6 text-center shadow-sm sm:p-10">
        <Radio size={32} className="text-[var(--color-accent)]" />
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Modo evento en vivo</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            El seguimiento usa la <strong className="text-[var(--color-text)]">fecha del evento</strong> y
            los horarios planificados. No se mueven las horas al iniciar.
          </p>
        </div>

        <label className="flex w-full max-w-xs flex-col gap-1 text-left text-sm">
          <span className="font-medium">Fecha del evento</span>
          <input
            type="date"
            value={evento.fecha}
            onChange={(e) => actualizarEvento(evento.id, { fecha: e.target.value })}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatearFechaLarga(evento.fecha)}
          </span>
        </label>

        {dia === 'futuro' && (
          <p className="rounded-2xl bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-accent)]">
            El evento es en el futuro. Podés iniciar el live para ensayar la UI; no habrá actividad “en
            curso” hasta ese día (salvo que cambies la fecha a hoy).
          </p>
        )}
        {dia === 'pasado' && (
          <p className="rounded-2xl bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-accent)]">
            La fecha del evento ya pasó. Actualizá la fecha si querés seguir un show de hoy.
          </p>
        )}

        <div className="flex flex-col items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              iniciarEvento();
              toast.success('Live activo — horarios planificados intactos');
            }}
          >
            Iniciar evento
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  'Esto moverá todos los horarios para que el rundown empiece ahora y pondrá la fecha en hoy. ¿Continuar?',
                )
              ) {
                reanclarAHoraActual();
                toast.message('Rundown reanclado a la hora actual');
              }
            }}
          >
            Reanclar a la hora actual…
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
          En vivo
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="max-w-[12rem] truncate text-xs capitalize sm:max-w-none sm:text-sm">
            {formatearFechaLarga(evento.fecha)}
          </span>
          <span className="font-mono text-base text-[var(--color-text)]">{formatHora(now)}</span>
        </div>
      </div>

      {dia !== 'hoy' && (
        <div className="rounded-2xl border border-[var(--color-accent-muted)] bg-[var(--color-accent-soft)] px-3 py-3 text-sm text-[var(--color-accent)] sm:px-4">
          {dia === 'futuro'
            ? 'Estás en live con una fecha futura: todavía no hay segmento en curso según el calendario.'
            : 'La fecha del evento ya pasó; el reloj marca todo como finalizado. Cambiá la fecha del evento si corresponde a hoy.'}
          <label className="mt-2 flex flex-col gap-1 text-xs text-[var(--color-text)] sm:flex-row sm:items-center sm:gap-2">
            Cambiar fecha
            <input
              type="date"
              value={evento.fecha}
              onChange={(e) => actualizarEvento(evento.id, { fecha: e.target.value })}
              className="w-full max-w-[12rem] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 sm:w-auto"
            />
          </label>
        </div>
      )}

      <section className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-4 shadow-sm sm:rounded-3xl sm:p-7">
        <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">
          Actividad actual
        </p>
        {resumen.actual ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold leading-tight sm:text-3xl">
                {resumen.actual.nombre}
              </h2>
              <EstadoBadge estado={resumen.actual.estado} />
              <CategoriaBadge categoria={resumen.actual.categoria} />
            </div>
            {resumen.actual.responsable && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
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
                <span>
                  {resumen.minutosRestantesActual !== null
                    ? `Quedan ${formatearDuracion(resumen.minutosRestantesActual)}`
                    : ''}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-accent-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-1000"
                  style={{ width: `${Math.round(resumen.progresoActual * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-5">
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() => {
                  finalizarActividadAhora(resumen.actual!.id);
                  toast.message('Actividad finalizada — horarios recalculados');
                }}
              >
                <CheckCircle2 size={16} />
                Finalizar ahora
              </Button>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Ajusta la duración real y recalcula las siguientes actividades en cascada.
              </p>
            </div>
          </>
        ) : (
          <p className="mt-3 text-[var(--color-text-muted)]">
            No hay actividad en curso en este momento
            {dia === 'futuro' ? ' (el evento aún no es hoy).' : '.'}
          </p>
        )}
      </section>

      <section
        className={`rounded-2xl border p-4 shadow-sm sm:rounded-3xl sm:p-7 ${
          alertaProxima
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
            : 'border-[var(--color-border)]/60 bg-[var(--color-surface)]'
        }`}
      >
        <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">
          Próxima actividad
        </p>
        {resumen.proxima ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold sm:text-xl">{resumen.proxima.nombre}</h3>
              <CategoriaBadge categoria={resumen.proxima.categoria} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock size={16} />
                Empieza a las {resumen.proxima.horaInicio}
              </span>
              {resumen.minutosParaProxima !== null && dia === 'hoy' && (
                <span
                  className={
                    alertaProxima
                      ? 'font-semibold text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)]'
                  }
                >
                  {resumen.minutosParaProxima === 0
                    ? '¡Es ahora!'
                    : `en ${formatearDuracion(resumen.minutosParaProxima)}`}
                </span>
              )}
              {dia === 'futuro' && (
                <span className="text-[var(--color-text-muted)]">
                  el {formatearFechaLarga(evento.fecha)}
                </span>
              )}
            </div>
            {alertaProxima && (
              <p className="mt-3 text-sm font-medium text-[var(--color-accent)]">
                Quedan 5 minutos o menos para el cambio de actividad.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-[var(--color-text-muted)]">No hay más actividades pendientes.</p>
        )}
      </section>

      <section>
        <h4 className="mb-2 text-xs font-medium tracking-wide text-[var(--color-text-muted)]">
          Rundown completo
        </h4>
        <ul className="divide-y divide-[var(--color-border)]/60 overflow-hidden rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-sm sm:rounded-3xl">
          {evento.actividades.map((act) => (
            <li
              key={act.id}
              className={`flex flex-col gap-1 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 ${
                act.id === resumen.actual?.id ? 'bg-[var(--color-accent-soft)]' : ''
              }`}
            >
              <div className="min-w-0">
                <span className="font-medium">{act.nombre}</span>
                <span className="mt-0.5 block text-[var(--color-text-muted)] sm:ml-2 sm:mt-0 sm:inline">
                  {act.horaInicio} · {formatearDuracion(act.duracionMinutos)}
                </span>
              </div>
              <EstadoBadge estado={act.estado} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

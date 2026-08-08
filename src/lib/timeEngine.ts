import {
  addMinutes,
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  isValid,
  parse,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  EventoActividad,
  HuecoOSolape,
  ResumenLive,
} from '../types/evento';

const HORA_FMT = 'HH:mm';
const FECHA_FMT = 'yyyy-MM-dd';

/** Parsea la fecha del evento (YYYY-MM-DD) a Date a medianoche local. */
export function parseFechaEvento(fecha: string): Date {
  const parsed = parse(fecha, FECHA_FMT, new Date());
  if (!isValid(parsed)) return startOfDay(new Date());
  return startOfDay(parsed);
}

/** Combina fecha del evento + HH:mm en un Date absoluto. */
export function fechaHoraEvento(fecha: string, hora: string): Date {
  return parseHora(hora, parseFechaEvento(fecha));
}

export type RelacionDia = 'pasado' | 'hoy' | 'futuro';

/** Compara la fecha del evento con el día de `now`. */
export function relacionDiaEvento(fecha: string, now: Date = new Date()): RelacionDia {
  const diff = differenceInCalendarDays(parseFechaEvento(fecha), startOfDay(now));
  if (diff < 0) return 'pasado';
  if (diff > 0) return 'futuro';
  return 'hoy';
}

export function formatearFechaLarga(fecha: string): string {
  return format(parseFechaEvento(fecha), "EEEE d 'de' MMMM yyyy", { locale: es });
}

/** Parsea "HH:mm" a Date anclado a una fecha base (por defecto hoy). */
export function parseHora(hora: string, baseDate: Date = new Date()): Date {
  const parsed = parse(hora, HORA_FMT, startOfDay(baseDate));
  if (!isValid(parsed)) {
    return setMinutes(setHours(startOfDay(baseDate), 0), 0);
  }
  return parsed;
}

export function formatHora(date: Date): string {
  return format(date, HORA_FMT);
}

/** Calcula la hora de fin a partir de inicio + duración. */
export function horaFin(horaInicio: string, duracionMinutos: number, baseDate?: Date): string {
  const inicio = parseHora(horaInicio, baseDate);
  return formatHora(addMinutes(inicio, Math.max(0, duracionMinutos)));
}

/**
 * Recalcula horaInicio en cascada: cada actividad empieza
 * cuando termina la anterior. Si se pasa anclaInicio, la primera
 * actividad se fija a esa hora (modo live / iniciar evento).
 */
export function recalcularCascada(
  actividades: EventoActividad[],
  anclaInicio?: string,
): EventoActividad[] {
  if (actividades.length === 0) return [];

  let cursor = anclaInicio ?? actividades[0].horaInicio;
  return actividades.map((act) => {
    const actualizada: EventoActividad = {
      ...act,
      horaInicio: cursor,
    };
    cursor = horaFin(cursor, act.duracionMinutos);
    return actualizada;
  });
}

/** Suma de duraciones de todos los segmentos. */
export function duracionTotal(actividades: EventoActividad[]): number {
  return actividades.reduce((acc, a) => acc + Math.max(0, a.duracionMinutos), 0);
}

/** Detecta huecos y solapamientos entre actividades consecutivas. */
export function detectarHuecosYSolapes(
  actividades: EventoActividad[],
  baseDate: Date = new Date(),
): HuecoOSolape[] {
  const issues: HuecoOSolape[] = [];
  for (let i = 0; i < actividades.length - 1; i++) {
    const actual = actividades[i];
    const siguiente = actividades[i + 1];
    const finActual = parseHora(horaFin(actual.horaInicio, actual.duracionMinutos), baseDate);
    const inicioSiguiente = parseHora(siguiente.horaInicio, baseDate);
    const diff = differenceInMinutes(inicioSiguiente, finActual);

    if (diff > 0) {
      issues.push({
        tipo: 'hueco',
        entreIds: [actual.id, siguiente.id],
        minutos: diff,
      });
    } else if (diff < 0) {
      issues.push({
        tipo: 'solape',
        entreIds: [actual.id, siguiente.id],
        minutos: Math.abs(diff),
      });
    }
  }
  return issues;
}

/**
 * Compara el fin real del rundown (inicio primera + duración total)
 * contra la hora de cierre planeada. Positivo = se pasa; negativo = sobra tiempo.
 */
export function diferenciaConCierre(
  actividades: EventoActividad[],
  horaCierrePlaneada: string | undefined,
  baseDate: Date = new Date(),
): number | null {
  if (!horaCierrePlaneada || actividades.length === 0) return null;
  const inicio = parseHora(actividades[0].horaInicio, baseDate);
  const finReal = addMinutes(inicio, duracionTotal(actividades));
  const cierre = parseHora(horaCierrePlaneada, baseDate);
  return differenceInMinutes(finReal, cierre);
}

/** Determina actividad actual/próxima y progreso según el reloj. */
export function actividadActualYProxima(
  actividades: EventoActividad[],
  now: Date,
  baseDate?: Date,
): ResumenLive {
  const base = baseDate ?? now;
  let actual: EventoActividad | null = null;
  let proxima: EventoActividad | null = null;
  let minutosParaProxima: number | null = null;
  let progresoActual = 0;
  let minutosRestantesActual: number | null = null;

  for (let i = 0; i < actividades.length; i++) {
    const act = actividades[i];
    if (act.estado === 'finalizada') continue;

    const inicio = parseHora(act.horaInicio, base);
    const fin = addMinutes(inicio, act.duracionMinutos);

    if (now >= inicio && now < fin) {
      actual = act;
      const transcurrido = differenceInMinutes(now, inicio);
      progresoActual = Math.min(1, Math.max(0, transcurrido / Math.max(1, act.duracionMinutos)));
      minutosRestantesActual = Math.max(0, differenceInMinutes(fin, now));
      proxima = actividades.slice(i + 1).find((a) => a.estado !== 'finalizada') ?? null;
      break;
    }

    if (now < inicio) {
      proxima = act;
      minutosParaProxima = differenceInMinutes(inicio, now);
      break;
    }
  }

  // Si ya hay actual, calcular countdown a la próxima
  if (actual && proxima && minutosParaProxima === null) {
    const inicioProx = parseHora(proxima.horaInicio, base);
    minutosParaProxima = Math.max(0, differenceInMinutes(inicioProx, now));
  }

  return {
    actual,
    proxima,
    minutosParaProxima,
    progresoActual,
    minutosRestantesActual,
  };
}

/**
 * Actualiza estados según el reloj real, anclado a la fecha del evento.
 * Si el evento es otro día, no marca nada como "en curso" por error de calendario.
 */
export function sincronizarEstadosPorReloj(
  actividades: EventoActividad[],
  now: Date,
  fechaEvento: string,
): EventoActividad[] {
  const base = parseFechaEvento(fechaEvento);
  const dia = relacionDiaEvento(fechaEvento, now);

  // Evento futuro: todo pendiente. Evento pasado: todo finalizado por tiempo.
  if (dia === 'futuro') {
    return actividades.map((act) =>
      act.estado === 'finalizada' ? act : { ...act, estado: 'pendiente' as const },
    );
  }

  return actividades.map((act) => {
    const inicio = parseHora(act.horaInicio, base);
    const fin = addMinutes(inicio, act.duracionMinutos);

    if (now >= fin || dia === 'pasado') {
      return { ...act, estado: 'finalizada' as const };
    }
    if (now >= inicio && now < fin) {
      return { ...act, estado: 'en_curso' as const };
    }
    return { ...act, estado: 'pendiente' as const };
  });
}

/** Vuelve todos los estados a pendiente (al salir del modo live sin alterar horarios). */
export function resetearEstadosPendientes(actividades: EventoActividad[]): EventoActividad[] {
  return actividades.map((act) => ({ ...act, estado: 'pendiente' as const }));
}

/** Formatea minutos como "15 min" o "1 h 30 min". */
export function formatearDuracion(minutos: number): string {
  const m = Math.max(0, Math.round(minutos));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto === 0 ? `${h} h` : `${h} h ${resto} min`;
}

/** Convierte Date a HH:mm. */
export function ahoraComoHora(now: Date = new Date()): string {
  return formatHora(now);
}

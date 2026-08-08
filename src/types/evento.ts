export type EstadoActividad = 'pendiente' | 'en_curso' | 'finalizada';

export type Categoria = 'charla' | 'break' | 'show' | 'otro';

export type VistaApp = 'timeline' | 'lista' | 'live';

export interface EventoActividad {
  id: string;
  nombre: string;
  /** Hora de inicio en formato HH:mm */
  horaInicio: string;
  duracionMinutos: number;
  responsable?: string;
  notas?: string;
  categoria?: Categoria;
  estado: EstadoActividad;
}

export interface Evento {
  id: string;
  nombre: string;
  /** Fecha del evento YYYY-MM-DD */
  fecha: string;
  /** Hora de cierre planeada HH:mm (opcional) */
  horaCierrePlaneada?: string;
  actividades: EventoActividad[];
  createdAt: string;
}

export interface HuecoOSolape {
  tipo: 'hueco' | 'solape';
  entreIds: [string, string];
  minutos: number;
}

export interface ResumenLive {
  actual: EventoActividad | null;
  proxima: EventoActividad | null;
  minutosParaProxima: number | null;
  progresoActual: number; // 0–1
  minutosRestantesActual: number | null;
}

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  charla: 'Charla',
  break: 'Break',
  show: 'Show',
  otro: 'Otro',
};

export const ESTADO_LABELS: Record<EstadoActividad, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  finalizada: 'Finalizada',
};

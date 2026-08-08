import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Categoria,
  EstadoActividad,
  Evento,
  EventoActividad,
  VistaApp,
} from '../types/evento';
import {
  ahoraComoHora,
  fechaHoraEvento,
  horaFin,
  recalcularCascada,
  resetearEstadosPendientes,
  sincronizarEstadosPorReloj,
} from '../lib/timeEngine';
import { crearEventoDemo } from '../lib/seed';
import { differenceInMinutes } from 'date-fns';

export type ActivityInput = {
  nombre: string;
  horaInicio: string;
  duracionMinutos: number;
  responsable?: string;
  notas?: string;
  categoria?: Categoria;
  estado?: EstadoActividad;
};

interface EventoState {
  eventos: Evento[];
  eventoActivoId: string | null;
  vista: VistaApp;
  darkMode: boolean;
  liveActivo: boolean;
  sonidoAlertas: boolean;
  alertadasIds: string[];
  nowTick: number;

  // Selectores helpers vía get
  getEventoActivo: () => Evento | null;

  setVista: (vista: VistaApp) => void;
  toggleDarkMode: () => void;
  toggleSonido: () => void;
  setEventoActivo: (id: string) => void;
  setNowTick: (ts: number) => void;

  crearEvento: (data: { nombre: string; fecha: string; horaCierrePlaneada?: string }) => void;
  actualizarEvento: (
    id: string,
    data: Partial<Pick<Evento, 'nombre' | 'fecha' | 'horaCierrePlaneada'>>,
  ) => void;
  eliminarEvento: (id: string) => void;
  duplicarEvento: (id: string) => void;

  agregarActividad: (input: ActivityInput, insertIndex?: number) => void;
  actualizarActividad: (actividadId: string, input: Partial<ActivityInput>) => void;
  eliminarActividad: (actividadId: string) => void;
  reordenarActividades: (fromIndex: number, toIndex: number) => void;

  /** Activa seguimiento en vivo sin mover los horarios planificados. */
  iniciarEvento: () => void;
  /** Sale del live y deja los horarios intactos; estados vuelven a pendiente. */
  detenerLive: () => void;
  /** Opcional: desplaza todo el rundown para que empiece "ahora" (atraso real). */
  reanclarAHoraActual: () => void;
  tickLive: (now: Date) => void;
  finalizarActividadAhora: (actividadId: string) => void;
  marcarAlerta: (actividadId: string) => void;
  resetAlertas: () => void;
}

function updateActivo(
  eventos: Evento[],
  eventoActivoId: string | null,
  updater: (ev: Evento) => Evento,
): Evento[] {
  if (!eventoActivoId) return eventos;
  return eventos.map((e) => (e.id === eventoActivoId ? updater(e) : e));
}

function formatFechaIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const demo = crearEventoDemo();

export const useEventoStore = create<EventoState>()(
  persist(
    (set, get) => ({
      eventos: [demo],
      eventoActivoId: demo.id,
      vista: 'timeline',
      darkMode: false,
      liveActivo: false,
      sonidoAlertas: true,
      alertadasIds: [],
      nowTick: Date.now(),

      getEventoActivo: () => {
        const { eventos, eventoActivoId } = get();
        return eventos.find((e) => e.id === eventoActivoId) ?? null;
      },

      setVista: (vista) => set({ vista }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      toggleSonido: () => set((s) => ({ sonidoAlertas: !s.sonidoAlertas })),
      setEventoActivo: (id) =>
        set({ eventoActivoId: id, liveActivo: false, alertadasIds: [], vista: 'timeline' }),
      setNowTick: (ts) => set({ nowTick: ts }),

      crearEvento: ({ nombre, fecha, horaCierrePlaneada }) => {
        const nuevo: Evento = {
          id: crypto.randomUUID(),
          nombre,
          fecha,
          horaCierrePlaneada,
          actividades: [],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          eventos: [...s.eventos, nuevo],
          eventoActivoId: nuevo.id,
          liveActivo: false,
          alertadasIds: [],
        }));
      },

      actualizarEvento: (id, data) => {
        set((s) => ({
          eventos: s.eventos.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
      },

      eliminarEvento: (id) => {
        set((s) => {
          const eventos = s.eventos.filter((e) => e.id !== id);
          const eventoActivoId =
            s.eventoActivoId === id ? (eventos[0]?.id ?? null) : s.eventoActivoId;
          return {
            eventos,
            eventoActivoId,
            liveActivo: s.eventoActivoId === id ? false : s.liveActivo,
          };
        });
      },

      duplicarEvento: (id) => {
        const origen = get().eventos.find((e) => e.id === id);
        if (!origen) return;
        const copia: Evento = {
          ...origen,
          id: crypto.randomUUID(),
          nombre: `${origen.nombre} (copia)`,
          createdAt: new Date().toISOString(),
          actividades: origen.actividades.map((a) => ({
            ...a,
            id: crypto.randomUUID(),
            estado: 'pendiente' as const,
          })),
        };
        set((s) => ({
          eventos: [...s.eventos, copia],
          eventoActivoId: copia.id,
          liveActivo: false,
          alertadasIds: [],
        }));
      },

      agregarActividad: (input, insertIndex) => {
        const actividad: EventoActividad = {
          id: crypto.randomUUID(),
          nombre: input.nombre,
          horaInicio: input.horaInicio,
          duracionMinutos: input.duracionMinutos,
          responsable: input.responsable,
          notas: input.notas,
          categoria: input.categoria,
          estado: input.estado ?? 'pendiente',
        };

        set((s) => ({
          eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => {
            const list = [...ev.actividades];
            const idx =
              insertIndex === undefined
                ? list.length
                : Math.max(0, Math.min(insertIndex, list.length));

            // Si insertamos entre medias, anclar hora a la del índice o a la fin de la anterior
            if (idx === 0 && list.length > 0) {
              actividad.horaInicio = list[0].horaInicio;
            } else if (idx > 0) {
              const prev = list[idx - 1];
              actividad.horaInicio = horaFin(prev.horaInicio, prev.duracionMinutos);
            }

            list.splice(idx, 0, actividad);
            const ancla = list[0]?.horaInicio;
            return { ...ev, actividades: recalcularCascada(list, ancla) };
          }),
        }));
      },

      actualizarActividad: (actividadId, input) => {
        set((s) => ({
          eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => {
            const list = ev.actividades.map((a) =>
              a.id === actividadId
                ? {
                    ...a,
                    ...input,
                    duracionMinutos: input.duracionMinutos ?? a.duracionMinutos,
                  }
                : a,
            );

            // Si se cambió la hora de la primera, usarla como ancla; si no, mantener ancla actual
            const idx = list.findIndex((a) => a.id === actividadId);
            let ancla = list[0]?.horaInicio;
            if (idx === 0 && input.horaInicio) {
              ancla = input.horaInicio;
            }
            return { ...ev, actividades: recalcularCascada(list, ancla) };
          }),
        }));
      },

      eliminarActividad: (actividadId) => {
        set((s) => ({
          eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => {
            const list = ev.actividades.filter((a) => a.id !== actividadId);
            const ancla = list[0]?.horaInicio;
            return {
              ...ev,
              actividades: list.length ? recalcularCascada(list, ancla) : [],
            };
          }),
        }));
      },

      reordenarActividades: (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        set((s) => ({
          eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => {
            const list = [...ev.actividades];
            const [moved] = list.splice(fromIndex, 1);
            list.splice(toIndex, 0, moved);
            const ancla = list[0]?.horaInicio;
            return { ...ev, actividades: recalcularCascada(list, ancla) };
          }),
        }));
      },

      iniciarEvento: () => {
        const now = new Date();
        set((s) => ({
          liveActivo: true,
          vista: 'live',
          alertadasIds: [],
          nowTick: now.getTime(),
          // No tocamos horaInicio: el live sigue el rundown planificado en la fecha del evento
          eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => ({
            ...ev,
            actividades: sincronizarEstadosPorReloj(ev.actividades, now, ev.fecha),
          })),
        }));
      },

      detenerLive: () => {
        set((s) => ({
          liveActivo: false,
          alertadasIds: [],
          eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => ({
            ...ev,
            actividades: resetearEstadosPendientes(ev.actividades),
          })),
        }));
      },

      reanclarAHoraActual: () => {
        const now = new Date();
        const hora = ahoraComoHora(now);
        set((s) => ({
          liveActivo: true,
          vista: 'live',
          alertadasIds: [],
          nowTick: now.getTime(),
          eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => {
            // Solo aquí se mueven los horarios: útil si el show arranca tarde el mismo día
            const reset = resetearEstadosPendientes(ev.actividades);
            const ancladas = recalcularCascada(reset, hora);
            return {
              ...ev,
              fecha: formatFechaIso(now),
              actividades: sincronizarEstadosPorReloj(ancladas, now, formatFechaIso(now)),
            };
          }),
        }));
      },

      tickLive: (now) => {
        set((s) => {
          if (!s.liveActivo) return { nowTick: now.getTime() };
          return {
            nowTick: now.getTime(),
            eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => ({
              ...ev,
              actividades: sincronizarEstadosPorReloj(ev.actividades, now, ev.fecha),
            })),
          };
        });
      },

      /**
       * Marca una actividad como finalizada "ahora":
       * ajusta su duración real y recalcula las siguientes en cascada.
       */
      finalizarActividadAhora: (actividadId) => {
        const now = new Date();
        set((s) => ({
          nowTick: now.getTime(),
          eventos: updateActivo(s.eventos, s.eventoActivoId, (ev) => {
            const idx = ev.actividades.findIndex((a) => a.id === actividadId);
            if (idx === -1) return ev;

            const list = [...ev.actividades];
            const act = list[idx];
            const inicio = fechaHoraEvento(ev.fecha, act.horaInicio);
            const duracionReal = Math.max(1, differenceInMinutes(now, inicio));

            list[idx] = {
              ...act,
              duracionMinutos: duracionReal,
              estado: 'finalizada',
            };

            const anteriores = list.slice(0, idx);
            const desdeAqui = recalcularCascada(list.slice(idx), act.horaInicio);
            const recalculadas = desdeAqui.map((a, i) =>
              i === 0
                ? { ...a, estado: 'finalizada' as const, duracionMinutos: duracionReal }
                : { ...a, estado: a.estado === 'finalizada' ? a.estado : ('pendiente' as const) },
            );

            return { ...ev, actividades: [...anteriores, ...recalculadas] };
          }),
        }));
      },

      marcarAlerta: (actividadId) => {
        set((s) =>
          s.alertadasIds.includes(actividadId)
            ? s
            : { alertadasIds: [...s.alertadasIds, actividadId] },
        );
      },

      resetAlertas: () => set({ alertadasIds: [] }),
    }),
    {
      name: 'rundown-eventos-v2',
      partialize: (state) => ({
        // No persistimos estados del live: al recargar todo vuelve a pendiente
        eventos: state.eventos.map((ev) => ({
          ...ev,
          actividades: ev.actividades.map((a) => ({
            ...a,
            estado: 'pendiente' as const,
          })),
        })),
        eventoActivoId: state.eventoActivoId,
        darkMode: state.darkMode,
        sonidoAlertas: state.sonidoAlertas,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Limpia estados viejos guardados cuando el live marcó el mañana como “finalizada”
        state.liveActivo = false;
        state.alertadasIds = [];
        state.eventos = state.eventos.map((ev) => ({
          ...ev,
          actividades: resetearEstadosPendientes(ev.actividades),
        }));
      },
    },
  ),
);

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useEventoStore } from '../store/eventoStore';
import { actividadActualYProxima, parseFechaEvento } from '../lib/timeEngine';
import {
  ALERTA_MINUTOS,
  debeAlertarProxima,
  notificarSistema,
  reproducirBeep,
} from '../lib/alertEngine';

/**
 * Reloj de 1s mientras liveActivo: actualiza estados y dispara alertas
 * cuando faltan ≤5 min para la próxima actividad.
 */
export function useLiveClock() {
  const liveActivo = useEventoStore((s) => s.liveActivo);
  const sonidoAlertas = useEventoStore((s) => s.sonidoAlertas);
  const tickLive = useEventoStore((s) => s.tickLive);
  const marcarAlerta = useEventoStore((s) => s.marcarAlerta);
  const alertadasIds = useEventoStore((s) => s.alertadasIds);
  const getEventoActivo = useEventoStore((s) => s.getEventoActivo);

  const alertadasRef = useRef(new Set<string>());

  useEffect(() => {
    alertadasRef.current = new Set(alertadasIds);
  }, [alertadasIds]);

  useEffect(() => {
    // Tick ligero siempre para la línea "ahora" en timeline (cada 30s si no hay live)
    const intervalMs = liveActivo ? 1000 : 30_000;

    const tick = () => {
      const now = new Date();
      tickLive(now);

      if (!liveActivo) return;

      const evento = getEventoActivo();
      if (!evento) return;

      const resumen = actividadActualYProxima(
        evento.actividades,
        now,
        parseFechaEvento(evento.fecha),
      );
      const proximaId = resumen.proxima?.id ?? null;

      if (
        debeAlertarProxima(
          resumen.minutosParaProxima,
          proximaId,
          alertadasRef.current,
          ALERTA_MINUTOS,
        ) &&
        resumen.proxima
      ) {
        const mins = resumen.minutosParaProxima ?? 0;
        const msg =
          mins <= 0
            ? `Es hora de: ${resumen.proxima.nombre}`
            : `Faltan ${mins} min para: ${resumen.proxima.nombre}`;

        toast.warning(msg, { duration: 8000 });
        notificarSistema('Cambio de actividad próximo', msg);
        if (sonidoAlertas) reproducirBeep();

        alertadasRef.current.add(resumen.proxima.id);
        marcarAlerta(resumen.proxima.id);
      }
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [liveActivo, sonidoAlertas, tickLive, marcarAlerta, getEventoActivo]);
}

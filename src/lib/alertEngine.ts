const ALERTA_MINUTOS = 5;

export interface AlertaPayload {
  actividadId: string;
  nombre: string;
  minutosRestantes: number;
}

/** Decide si debe dispararse la alerta de "próxima actividad". */
export function debeAlertarProxima(
  minutosParaProxima: number | null,
  proximaId: string | null,
  yaAlertadas: Set<string>,
  umbralMinutos: number = ALERTA_MINUTOS,
): boolean {
  if (minutosParaProxima === null || !proximaId) return false;
  if (yaAlertadas.has(proximaId)) return false;
  return minutosParaProxima <= umbralMinutos && minutosParaProxima >= 0;
}

/** Beep corto con Web Audio API (sin archivo externo). */
export function reproducirBeep(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => void ctx.close();
  } catch {
    // Silenciar si el navegador bloquea audio
  }
}

/** Solicita permiso de notificaciones del sistema. */
export async function pedirPermisoNotificaciones(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

/** Muestra una notificación del sistema si hay permiso. */
export function notificarSistema(titulo: string, cuerpo: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(titulo, {
      body: cuerpo,
      tag: 'rundown-alerta',
    });
  } catch {
    // Ignorar errores de Notification en algunos contextos
  }
}

export { ALERTA_MINUTOS };

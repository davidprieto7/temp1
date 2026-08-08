import { useEffect, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  Copy,
  Download,
  List,
  Menu,
  Moon,
  Plus,
  Radio,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEventoStore } from '../../store/eventoStore';
import { exportarEventoCsv } from '../../lib/exportCsv';
import { pedirPermisoNotificaciones } from '../../lib/alertEngine';
import { horaFin } from '../../lib/timeEngine';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EventoForm } from '../forms/EventoForm';
import { ActivityForm } from '../forms/ActivityForm';
import { EventSummary } from './EventSummary';
import type { EventoActividad, VistaApp } from '../../types/evento';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const eventos = useEventoStore((s) => s.eventos);
  const eventoActivoId = useEventoStore((s) => s.eventoActivoId);
  const vista = useEventoStore((s) => s.vista);
  const darkMode = useEventoStore((s) => s.darkMode);
  const liveActivo = useEventoStore((s) => s.liveActivo);
  const sonidoAlertas = useEventoStore((s) => s.sonidoAlertas);

  const setVista = useEventoStore((s) => s.setVista);
  const setEventoActivo = useEventoStore((s) => s.setEventoActivo);
  const toggleDarkMode = useEventoStore((s) => s.toggleDarkMode);
  const toggleSonido = useEventoStore((s) => s.toggleSonido);
  const crearEvento = useEventoStore((s) => s.crearEvento);
  const actualizarEvento = useEventoStore((s) => s.actualizarEvento);
  const eliminarEvento = useEventoStore((s) => s.eliminarEvento);
  const duplicarEvento = useEventoStore((s) => s.duplicarEvento);
  const agregarActividad = useEventoStore((s) => s.agregarActividad);
  const iniciarEvento = useEventoStore((s) => s.iniciarEvento);
  const detenerLive = useEventoStore((s) => s.detenerLive);

  const cambiarVista = (v: VistaApp) => {
    if (liveActivo && v !== 'live') {
      detenerLive();
    }
    setVista(v);
  };

  const evento = eventos.find((e) => e.id === eventoActivoId) ?? null;

  const [modalEvento, setModalEvento] = useState<'crear' | 'editar' | null>(null);
  const [modalActividad, setModalActividad] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const vistas: { id: VistaApp; label: string; icon: ReactNode }[] = [
    { id: 'timeline', label: 'Timeline', icon: <CalendarDays size={16} /> },
    { id: 'lista', label: 'Lista', icon: <List size={16} /> },
    { id: 'live', label: 'Live', icon: <Radio size={16} /> },
  ];

  const defaultHoraNueva =
    evento && evento.actividades.length > 0
      ? horaFin(
          evento.actividades[evento.actividades.length - 1].horaInicio,
          evento.actividades[evento.actividades.length - 1].duracionMinutos,
        )
      : '09:00';

  const handleIniciar = async () => {
    await pedirPermisoNotificaciones();
    iniciarEvento();
    toast.success('Live activo — se sigue el rundown en la fecha del evento');
  };

  return (
    <div className="flex h-full min-h-0 w-full max-w-[100vw] overflow-hidden bg-[var(--color-surface-muted)] text-[var(--color-text)]">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,85vw)] shrink-0 flex-col border-r border-[var(--color-border)]/60 bg-[var(--color-surface)] transition-transform duration-200 lg:static lg:w-64 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 px-4 py-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">
              Rundown
            </p>
            <h1 className="text-lg font-semibold leading-tight tracking-tight">Eventos</h1>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setModalEvento('crear')}
            aria-label="Nuevo evento"
          >
            <Plus size={16} />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain p-2">
          {eventos.length === 0 && (
            <p className="px-2 py-4 text-sm text-[var(--color-text-muted)]">
              No hay eventos. Creá uno para empezar.
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {eventos.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEventoActivo(ev.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm transition active:scale-[0.99] ${
                    ev.id === eventoActivoId
                      ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]'
                      : 'hover:bg-[var(--color-surface-muted)]'
                  }`}
                >
                  <span className="block truncate">{ev.nombre}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{ev.fecha}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)]/60 bg-[var(--color-surface)]/90 backdrop-blur-xl">
          {/* Fila 1: menú + título + fecha + vistas */}
          <div className="flex items-start gap-2 px-3 py-2.5 sm:items-center sm:px-5 sm:py-3">
            <Button
              size="sm"
              variant="ghost"
              className="mt-0.5 shrink-0 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir eventos"
            >
              <Menu size={18} />
            </Button>

            <div className="min-w-0 flex-1">
              {evento ? (
                <>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <button
                      type="button"
                      className="max-w-full truncate text-left text-base font-semibold tracking-tight hover:text-[var(--color-accent)] sm:text-lg"
                      onClick={() => setModalEvento('editar')}
                      title="Editar evento"
                    >
                      {evento.nombre}
                    </button>
                    <label className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                      <span className="sr-only sm:not-sr-only sm:inline">Fecha</span>
                      <input
                        type="date"
                        value={evento.fecha}
                        onChange={(e) => {
                          actualizarEvento(evento.id, { fecha: e.target.value });
                          toast.message('Fecha del evento actualizada');
                        }}
                        className="max-w-[10.5rem] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 sm:max-w-none"
                        title="Fecha del evento"
                      />
                    </label>
                  </div>
                  <div className="mt-1">
                    <EventSummary evento={evento} compact />
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Seleccioná un evento</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--color-surface-muted)] p-0.5 sm:gap-1">
              {vistas.map((v) => (
                <Button
                  key={v.id}
                  size="sm"
                  variant={vista === v.id ? 'primary' : 'ghost'}
                  className="min-w-9 px-2 sm:min-w-0 sm:px-3"
                  onClick={() => cambiarVista(v.id)}
                  disabled={!evento}
                  aria-label={v.label}
                  title={v.label}
                >
                  {v.icon}
                  <span className="hidden md:inline">{v.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Fila 2: acciones */}
          {evento && (
            <div className="flex items-center gap-1 overflow-x-auto overscroll-x-contain border-t border-[var(--color-border)]/60 px-3 py-2 sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:px-5 sm:py-2.5">
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={() => setModalActividad(true)}
              >
                <Plus size={14} />
                <span className="hidden xs:inline sm:inline">Actividad</span>
              </Button>

              {!liveActivo ? (
                <Button
                  size="sm"
                  variant="primary"
                  className="shrink-0"
                  onClick={() => void handleIniciar()}
                >
                  <Radio size={14} />
                  <span className="hidden sm:inline">Iniciar</span>
                </Button>
              ) : (
                <Button size="sm" variant="secondary" className="shrink-0" onClick={detenerLive}>
                  Detener
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => {
                  exportarEventoCsv(evento);
                  toast.success('CSV exportado');
                }}
                aria-label="Exportar CSV"
              >
                <Download size={14} />
                <span className="hidden lg:inline">CSV</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => {
                  duplicarEvento(evento.id);
                  toast.success('Evento duplicado');
                }}
                aria-label="Duplicar evento"
              >
                <Copy size={14} />
                <span className="hidden lg:inline">Duplicar</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => {
                  if (confirm(`¿Eliminar «${evento.nombre}»?`)) {
                    eliminarEvento(evento.id);
                    toast.message('Evento eliminado');
                  }
                }}
                aria-label="Eliminar evento"
              >
                <Trash2 size={14} />
              </Button>

              <div className="ml-auto flex shrink-0 items-center gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleSonido}
                  title={sonidoAlertas ? 'Silenciar alertas' : 'Activar sonido'}
                  aria-label="Sonido"
                >
                  {sonidoAlertas ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleDarkMode}
                  title="Modo oscuro"
                  aria-label="Tema"
                >
                  {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                </Button>
              </div>
            </div>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-6 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      <Modal
        open={modalEvento !== null}
        title={modalEvento === 'crear' ? 'Nuevo evento' : 'Editar evento'}
        onClose={() => setModalEvento(null)}
      >
        <EventoForm
          initial={
            modalEvento === 'editar' && evento
              ? {
                  nombre: evento.nombre,
                  fecha: evento.fecha,
                  horaCierrePlaneada: evento.horaCierrePlaneada,
                }
              : undefined
          }
          submitLabel={modalEvento === 'crear' ? 'Crear' : 'Guardar'}
          onCancel={() => setModalEvento(null)}
          onSubmit={(data) => {
            if (modalEvento === 'crear') {
              crearEvento(data);
              toast.success('Evento creado');
            } else if (evento) {
              actualizarEvento(evento.id, data);
              toast.success('Evento actualizado');
            }
            setModalEvento(null);
          }}
        />
      </Modal>

      <Modal
        open={modalActividad}
        title="Nueva actividad"
        onClose={() => setModalActividad(false)}
      >
        <ActivityForm
          defaultHoraInicio={defaultHoraNueva}
          submitLabel="Agregar"
          onCancel={() => setModalActividad(false)}
          onSubmit={(data) => {
            agregarActividad(data);
            setModalActividad(false);
            toast.success('Actividad agregada');
          }}
        />
      </Modal>
    </div>
  );
}

export type { EventoActividad };

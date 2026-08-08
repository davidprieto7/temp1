import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import { TimelineView } from './components/timeline/TimelineView';
import { ListView } from './components/list/ListView';
import { LiveMode } from './components/live/LiveMode';
import { useEventoStore } from './store/eventoStore';
import { useLiveClock } from './hooks/useLiveClock';

function VistaActiva() {
  const vista = useEventoStore((s) => s.vista);
  switch (vista) {
    case 'lista':
      return <ListView />;
    case 'live':
      return <LiveMode />;
    default:
      return <TimelineView />;
  }
}

export default function App() {
  useLiveClock();
  const darkMode = useEventoStore((s) => s.darkMode);

  return (
    <>
      <AppShell>
        <VistaActiva />
      </AppShell>
      <Toaster
        theme={darkMode ? 'dark' : 'light'}
        position="top-center"
        richColors
        closeButton
      />
    </>
  );
}

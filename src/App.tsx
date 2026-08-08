import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import { TimelineView } from './components/timeline/TimelineView';
import { ListView } from './components/list/ListView';
import { LiveMode } from './components/live/LiveMode';
import { PublicView } from './components/public/PublicView';
import { AdminGate } from './components/admin/AdminGate';
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

function AdminApp() {
  useLiveClock();
  return (
    <AdminGate>
      <AppShell>
        <VistaActiva />
      </AppShell>
    </AdminGate>
  );
}

export default function App() {
  const darkMode = useEventoStore((s) => s.darkMode);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicView />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        theme={darkMode ? 'dark' : 'light'}
        position="top-center"
        richColors
        closeButton
      />
    </BrowserRouter>
  );
}

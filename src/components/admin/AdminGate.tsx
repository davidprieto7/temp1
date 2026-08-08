import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_PIN, isAdminAutenticado, setAdminAutenticado } from '../../lib/adminAuth';
import { Button } from '../ui/Button';

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const [authed, setAuthed] = useState(() => isAdminAutenticado());
  const [pin, setPin] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pin.trim() === ADMIN_PIN) {
      setAdminAutenticado(true);
      setAuthed(true);
      toast.success('Acceso de administrador');
      return;
    }
    toast.error('PIN incorrecto');
    setPin('');
  };

  const hint = useMemo(() => 'PIN por defecto: admin', []);

  if (!authed) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-surface-muted)] px-4 py-10">
        <div className="w-full max-w-sm rounded-3xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Lock size={22} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Administración</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Ingresá el PIN para editar el rundown y controlar el evento en vivo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">PIN</span>
              <input
                type="password"
                inputMode="text"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                placeholder="••••"
                autoFocus
              />
            </label>
            <Button type="submit" variant="primary" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-[var(--color-text-muted)]">{hint}</p>

          <div className="mt-5 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
            >
              <Radio size={14} />
              Ir a vista pública
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

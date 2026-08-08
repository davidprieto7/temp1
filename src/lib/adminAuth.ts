/** PIN de acceso al panel admin (v1 local). Cambialo antes de producción. */
export const ADMIN_PIN = 'admin';

const AUTH_KEY = 'rundown-admin-auth';

export function isAdminAutenticado(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAdminAutenticado(ok: boolean): void {
  try {
    if (ok) sessionStorage.setItem(AUTH_KEY, '1');
    else sessionStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
}

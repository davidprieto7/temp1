# Rundown — Minuto a minuto

Aplicación web para planificar, editar y monitorear el rundown (timeline) de un evento en vivo.

## Vistas

| Ruta | Uso |
|------|-----|
| `/` | **Pública** — solo lectura para el público (ahora / siguiente / programa) |
| `/admin` | **Administración** — editar rundown, live, exportar (PIN: `admin`) |

Desde admin, el botón **Compartir** copia un link con el rundown embebido (`/#e=...`) para abrirlo en otro dispositivo.

## Stack

- React + TypeScript + Vite + React Router
- Tailwind CSS
- Zustand (estado + LocalStorage)
- dnd-kit, date-fns, lucide-react, sonner

## Cómo correr

```bash
npm install
npm run dev
```

- Público: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin` (PIN `admin`)

## Funcionalidades

- CRUD de eventos y actividades
- Recálculo automático de horarios en cascada
- Vista timeline + lista + modo live (admin)
- Vista pública compartible
- Alerta a 5 minutos (toast + notificación + sonido)
- Exportar CSV, duplicar evento, modo oscuro
- Persistencia en LocalStorage

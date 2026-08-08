# Rundown — Minuto a minuto

Aplicación web para planificar, editar y monitorear el rundown (timeline) de un evento en vivo.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand (estado + LocalStorage)
- dnd-kit (reordenar)
- date-fns, lucide-react, sonner

## Cómo correr

```bash
npm install
npm run dev
```

Abrí la URL que muestre Vite (por defecto `http://localhost:5173`).

## Funcionalidades

- CRUD de eventos y actividades
- Recálculo automático de horarios en cascada (duración, reorder, insertar)
- Vista timeline vertical + vista lista + modo live
- Alerta a 5 minutos de la próxima actividad (toast + notificación del sistema + sonido)
- Exportar CSV, duplicar evento, modo oscuro
- Persistencia en LocalStorage (`rundown-eventos-v1`)
# temp1

import type { Categoria, Evento, EventoActividad } from '../types/evento';
import { recalcularCascada } from './timeEngine';

const DEMO_ID = 'tech-caribe-fest-1';

function hoyIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type SeedAct = {
  nombre: string;
  duracionMinutos: number;
  responsable?: string;
  categoria?: Categoria;
  notas?: string;
};

function buildActividades(items: SeedAct[]): EventoActividad[] {
  const raw: EventoActividad[] = items.map((item) => ({
    id: crypto.randomUUID(),
    nombre: item.nombre,
    horaInicio: '09:00',
    duracionMinutos: item.duracionMinutos,
    responsable: item.responsable,
    categoria: item.categoria,
    notas: item.notas,
    estado: 'pendiente',
  }));
  return recalcularCascada(raw, '09:00');
}

/**
 * Rundown Tech Caribe Fest (Episodios 1–4) a partir del PDF de producción.
 * Los horarios se recalculan en cascada desde 09:00; los breaks cierran huecos del día.
 */
export function crearEventoDemo(): Evento {
  const actividades = buildActividades([
    // ——— Pre-show ———
    {
      nombre: 'Puertas y zona de aliados',
      duracionMinutos: 20,
      responsable: 'Producción',
      categoria: 'otro',
      notas: 'Apertura de puertas desde las 9:00. Zona de aliados / stands.',
    },

    // ——— Episodio 1 · 9:20–10:50 (90 min) ———
    {
      nombre: 'Bienvenida — Apertura de temporada',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'otro',
      notas: 'Entrada y bienvenida musical. Sponsor sugerido: Presenting (Epicentro).',
    },
    {
      nombre: 'Monólogo — El monólogo',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'show',
      notas: 'Tesis del día: tecnología como cultura; humor costeño y actualidad tech (standup).',
    },
    {
      nombre: 'Noticias tech',
      duracionMinutos: 15,
      responsable: 'Juan Almanza',
      categoria: 'charla',
      notas: 'Segmento de noticias del mundo tech.',
    },
    {
      nombre: 'Charla — IA y computación cuántica',
      duracionMinutos: 20,
      responsable: 'Carlos Orozco',
      categoria: 'charla',
      notas:
        'Inteligencia artificial y computación cuántica: dos revoluciones destinadas a converger.',
    },
    {
      nombre: 'El Sofá — Podcast',
      duracionMinutos: 25,
      responsable: 'Anuar, Jorge y Juan',
      categoria: 'show',
      notas: 'El oficio, los fundamentos, su historia; preguntas fijas del show. Sponsor: El Sofá (Platino).',
    },
    {
      nombre: 'Batalla Dev',
      duracionMinutos: 10,
      responsable: 'Juan y Jorge',
      categoria: 'show',
      notas: 'Dinámica en vivo. Sponsor sugerido: Hot-Takes (Oro).',
    },
    {
      nombre: 'Momento musical',
      duracionMinutos: 5,
      responsable: 'Jorge',
      categoria: 'show',
      notas: 'Música ligera.',
    },
    {
      nombre: 'Cierre — El ritual',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'otro',
      notas: 'Declaración con el público + teaser del Episodio 2 (capital y founders).',
    },

    // ——— Break ———
    {
      nombre: 'Break de café y feria',
      duracionMinutos: 20,
      categoria: 'break',
      notas: '10:50–11:10. Sponsor Plata. Ventana de stands / aliados.',
    },

    // ——— Episodio 2 · 11:10–12:40 (90 min) ———
    {
      nombre: 'Bienvenida — Reapertura',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'otro',
      notas: 'Anuar retoma el hilo: del talento al capital.',
    },
    {
      nombre: 'Monólogo',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'show',
    },
    {
      nombre: 'Hecho en el Caribe',
      duracionMinutos: 15,
      responsable: 'Jissad, Tatiana, Felipe, Angel',
      categoria: 'show',
      notas:
        'Founders acelerados por Caribe Ventures muestran en vivo lo que están construyendo.',
    },
    {
      nombre: 'Charla — Herramientas para crear contenido',
      duracionMinutos: 20,
      responsable: 'Carlos Alarcón',
      categoria: 'charla',
      notas: 'Sponsor sugerido: Caribe Ventures / dispositivo · banco.',
    },
    {
      nombre: 'El Sofá — Capital y escala',
      duracionMinutos: 25,
      responsable: 'Carlos Alarcón',
      categoria: 'show',
      notas:
        'Capital, escala, IA y cómo es emprender desde Latinoamérica y los retos personales. Sponsor: El Sofá (Platino).',
    },
    {
      nombre: 'Batalla Dev',
      duracionMinutos: 10,
      categoria: 'show',
      notas: 'Dinámica en vivo.',
    },
    {
      nombre: 'Momento musical',
      duracionMinutos: 5,
      responsable: 'Grace',
      categoria: 'show',
      notas: 'Cierre de energía antes del almuerzo.',
    },
    {
      nombre: 'Cierre — El ritual',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'otro',
      notas:
        'Declaración + instrucciones de almuerzo, feria y demos en el foyer; teaser del Episodio 3.',
    },

    // ——— Almuerzo ———
    {
      nombre: 'Almuerzo + feria + demos',
      duracionMinutos: 80,
      categoria: 'break',
      notas: 'Ventana grande de stands y demos en foyer (hasta reapertura 14:00).',
    },

    // ——— Episodio 3 · 14:00–15:30 (90 min) ———
    {
      nombre: 'Bienvenida — Reapertura',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'otro',
      notas: 'Anuar retoma el hilo: trabajo remoto e internacional.',
    },
    {
      nombre: 'Monólogo',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'show',
    },
    {
      nombre: 'Noticias — Entrevista técnica con el público',
      duracionMinutos: 15,
      responsable: 'Eduardo Manrique',
      categoria: 'charla',
    },
    {
      nombre: 'Charla — Qué hace que te contraten',
      duracionMinutos: 20,
      responsable: 'Juan Cardona',
      categoria: 'charla',
    },
    {
      nombre: 'El Sofá — Trabajo remoto y EPAM',
      duracionMinutos: 25,
      responsable: 'Juan Cardona, Merlys',
      categoria: 'show',
      notas: 'Trabajo remoto y EPAM.',
    },
    {
      nombre: 'Batalla Dev',
      duracionMinutos: 10,
      categoria: 'show',
    },
    {
      nombre: 'Momento musical',
      duracionMinutos: 5,
      responsable: 'Cancast',
      categoria: 'show',
    },
    {
      nombre: 'Cierre — El ritual',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'otro',
      notas: 'Declaración con el público + teaser del Episodio 4 (Midudev).',
    },

    // ——— Break corto ———
    {
      nombre: 'Break / transición',
      duracionMinutos: 15,
      categoria: 'break',
      notas: 'Puente hacia el Episodio 4.',
    },

    // ——— Episodio 4 · 15:45–17:05 ———
    // Nota: el PDF tenía desfases en Ep.4 (Batalla 25 min vs reloj 4:50–4:55);
    // aquí se usa la duración coherente con el reloj del documento.
    {
      nombre: 'Bienvenida — Reapertura',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'otro',
      notas: 'Anuar retoma el hilo del bloque final.',
    },
    {
      nombre: 'Monólogo',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'show',
    },
    {
      nombre: 'Charla — Programa la web del futuro con IA',
      duracionMinutos: 20,
      responsable: 'Midudev',
      categoria: 'charla',
    },
    {
      nombre: 'El Sofá — Futuro para developers',
      duracionMinutos: 25,
      responsable: 'Midudev',
      categoria: 'show',
      notas: 'El futuro para los developers y vida personal.',
    },
    {
      nombre: 'Batalla Dev — Panel Pelaos de la Costa',
      duracionMinutos: 5,
      responsable: 'Pelaos de la Costa',
      categoria: 'show',
      notas: 'Panel sobre qué significa ser dev en la costa.',
    },
    {
      nombre: 'Momento musical',
      duracionMinutos: 5,
      responsable: 'Grace',
      categoria: 'show',
    },
    {
      nombre: 'Cierre — El ritual',
      duracionMinutos: 5,
      responsable: 'Anuar',
      categoria: 'otro',
      notas: 'Declaración final con el público.',
    },

    // ——— Bonus ———
    {
      nombre: 'Bonus — Panel todos los invitados',
      duracionMinutos: 20,
      categoria: 'charla',
      notas: 'Panel de cierre con todos los invitados del día.',
    },
  ]);

  return {
    id: DEMO_ID,
    nombre: 'Tech Caribe Fest',
    fecha: hoyIso(),
    horaCierrePlaneada: '17:25',
    actividades,
    createdAt: new Date().toISOString(),
  };
}

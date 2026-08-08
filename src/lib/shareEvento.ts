import type { Evento } from '../types/evento';

/** Codifica un evento para compartirlo en la URL (#e=...). */
export function encodeEventoShare(evento: Evento): string {
  const json = JSON.stringify(evento);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decodifica un evento desde el fragmento de URL. */
export function decodeEventoShare(encoded: string): Evento | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json) as Evento;
    if (!data?.id || !data?.nombre || !Array.isArray(data.actividades)) return null;
    return data;
  } catch {
    return null;
  }
}

/** URL pública con los datos del evento embebidos (funciona en otro dispositivo). */
export function buildPublicShareUrl(evento: Evento, origin = window.location.origin): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/#e=${encodeEventoShare(evento)}`;
}

/** URL pública simple (misma app / mismo navegador). */
export function buildPublicUrl(origin = window.location.origin): string {
  return `${origin.replace(/\/$/, '')}/`;
}

export function extractShareFromHash(hash: string): string | null {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!clean) return null;
  const params = new URLSearchParams(clean.includes('=') ? clean : `e=${clean}`);
  return params.get('e');
}

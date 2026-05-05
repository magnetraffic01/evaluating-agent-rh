// src/lib/storage.ts
// Subida de CVs al backend Express. Reemplaza al storage de Supabase.

import { storage as apiStorage, ApiError, API_BASE_URL } from '@/lib/api';

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export type UploadResult =
  | { ok: true;  path: string; signedUrl: string }
  | { ok: false; error: string };

/**
 * Valida el archivo antes de subirlo.
 */
export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Formato no permitido. Usa PDF, DOC, DOCX, JPG, PNG o WEBP.';
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `El archivo supera los ${MAX_SIZE_MB} MB permitidos.`;
  }
  return null;
}

/**
 * Convierte la URL devuelta por el backend en una URL absoluta utilizable
 * desde el frontend (en caso de que el backend devuelva una ruta relativa
 * tipo `/files/cv-xxx.pdf`).
 */
function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  // Bug fix 2026-05-05: hr-api.magnetraffic.com nunca se configuró en DNS.
  // Si el backend devuelve esa URL absoluta (porque UPLOAD_PUBLIC_URL la sigue
  // teniendo en .env), reescribimos para servir desde el dominio real del API.
  if (/https?:\/\/hr-api\.magnetraffic\.com\b/i.test(url)) {
    try {
      const u = new URL(url);
      return `${API_BASE_URL.replace(/\/+$/, '')}${u.pathname}${u.search}`;
    } catch {
      return url.replace(/^https?:\/\/hr-api\.magnetraffic\.com/i, API_BASE_URL.replace(/\/+$/, ''));
    }
  }
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE_URL.replace(/\/+$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Sube un CV al backend y retorna la URL pública/servible.
 * El parámetro `sessionId` se conserva para compatibilidad con el flujo
 * existente, aunque actualmente el backend genera nombres únicos por sí mismo.
 */
export async function uploadCV(
  file: File,
  _sessionId: string,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  // Progreso simulado — fetch no expone progreso de upload nativo.
  onProgress?.(10);

  try {
    const res = await apiStorage.upload(file);
    onProgress?.(100);
    const absoluteUrl = toAbsoluteUrl(res.url);
    return { ok: true, path: res.filename, signedUrl: absoluteUrl };
  } catch (e) {
    const msg = e instanceof ApiError
      ? (e.code === 'file_too_large'   ? `El archivo supera los ${MAX_SIZE_MB} MB permitidos.`
        : e.code === 'mime_not_allowed' ? 'Formato no permitido.'
        : e.code === 'file_required'    ? 'No se recibió ningún archivo.'
        : (e.message || 'Error al subir el archivo.'))
      : 'Error al subir el archivo.';
    return { ok: false, error: msg };
  }
}

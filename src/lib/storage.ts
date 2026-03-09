import { supabase, supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'cvs';
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png', 'image/webp'];
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 año en segundos

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
 * Sube un CV al bucket privado 'cvs' y retorna una URL firmada.
 * Ruta: cvs/{sessionId}/{timestamp}-{nombre_sanitizado}
 */
export async function uploadCV(
  file: File,
  sessionId: string,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  // Sanitizar nombre del archivo
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_');
  const path = `${sessionId}/${Date.now()}-${safe}`;

  // Simular progreso inicial mientras sube (Supabase JS no expone progreso real)
  onProgress?.(10);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  onProgress?.(80);

  // Generar URL firmada con el cliente admin (bucket privado)
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);

  onProgress?.(100);

  if (signedError || !signedData?.signedUrl) {
    // Subida exitosa pero no se pudo firmar — guardamos el path como fallback
    return { ok: true, path, signedUrl: path };
  }

  return { ok: true, path, signedUrl: signedData.signedUrl };
}

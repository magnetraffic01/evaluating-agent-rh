// src/lib/supabase.ts
// DEPRECADO — el frontend ahora habla con el backend Express+MySQL via `@/lib/api`.
// Este archivo se conserva solo para no romper imports legacy mientras se completa
// la migración. NO contiene un cliente Supabase real.
//
// Si encuentras código importando desde aquí, migrarlo a `@/lib/api`.
//
// ──────────────────────────────────────────────────────────────────────────────
// Código original de Supabase (comentado para referencia histórica):
//
// import { createClient } from '@supabase/supabase-js';
// const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// export const supabase = createClient(supabaseUrl, supabaseAnonKey, { ... });
// export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { ... });
// export const supabaseAdmin = supabase;
// ──────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/api';

/**
 * Re-export del cliente API real. Si algún módulo legacy todavía hace
 * `import { supabase } from '@/lib/supabase'` debe migrarse a:
 *   `import api from '@/lib/api'`
 */
export const supabase = apiClient;
export const supabaseAdmin = apiClient;
export const supabaseAuth = apiClient;

export default apiClient;

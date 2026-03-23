import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

// Cliente principal — evaluación de candidatos + admin dashboard (anon key, sin sesión persistente)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:      false,
    autoRefreshToken:    false,
    detectSessionInUrl:  false,
  },
});

// Cliente portal — reclutadoras (anon key + sesión persistente + storage key propio para evitar conflictos)
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:      true,
    autoRefreshToken:    true,
    detectSessionInUrl:  false,
    storageKey:          'sb-portal-auth-token',
  },
});

// Alias para compatibilidad con imports existentes en Admin.tsx
export const supabaseAdmin = supabase;

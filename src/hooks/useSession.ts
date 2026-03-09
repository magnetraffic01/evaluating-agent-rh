import { supabase } from '@/lib/supabase';
import { EvaluationState } from '@/types/evaluation';

/**
 * Mapea el estado local (camelCase) a la estructura de columnas de Supabase (snake_case)
 */
function toRow(state: EvaluationState) {
  return {
    session_id:       state.sessionId,
    name:             state.name,
    phone:            state.phone,
    email:            state.email || null,
    age:              state.age,
    location:         state.location || null,
    marital_status:   state.maritalStatus || null,
    daily_calls:      state.dailyCalls || null,
    last_income:      state.lastIncome || null,
    exit_reason:      state.exitReason || null,
    highlight:        state.highlight || null,
    cv_url:           state.cvUrl || null,
    linkedin_url:     state.linkedinUrl || null,
    score_total:      state.totalScore,
    score_breakdown:  state.scores,
    flags:            state.flags,
    status:           state.status,
    disqualify_reason: state.disqualifyReason,
    current_step:     state.currentStep,
    completed_at:     state.completedAt || null,
    last_activity:    new Date().toISOString(),
    user_agent:       typeof navigator !== 'undefined' ? navigator.userAgent : null,
  };
}

/**
 * Sincroniza el estado actual con Supabase (upsert).
 * Usa session_id como clave de conflicto — funciona para INSERT y UPDATE.
 * Fire-and-forget durante el flujo normal (no bloquea la UI).
 */
export async function syncToSupabase(state: EvaluationState): Promise<void> {
  const { error } = await supabase
    .from('evaluations')
    .upsert(toRow(state), { onConflict: 'session_id' });

  if (error && import.meta.env.DEV) {
    console.error('[Supabase] sync error:', error.message);
  }
}

/**
 * Guarda el estado final al completar o descartar.
 * Retorna error para manejarlo en la UI si es necesario.
 */
export async function completeInSupabase(state: EvaluationState): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('evaluations')
    .upsert(toRow(state), { onConflict: 'session_id' });

  if (error) {
    if (import.meta.env.DEV) console.error('[Supabase] complete error:', error.message);
    return { error: error.message };
  }
  return { error: null };
}

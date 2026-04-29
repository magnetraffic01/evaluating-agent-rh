// src/hooks/useSession.ts
// Persistencia del estado de la evaluación contra el backend Express.
// Reemplaza el upsert previo a Supabase con POST (crear) + PATCH (actualizar).

import { evaluations as apiEvaluations, ApiError, type EvaluationCreateBody, type EvaluationUpdateBody } from '@/lib/api';
import { EvaluationState } from '@/types/evaluation';

// Mapa de `session_id` → `id` interno del backend, persistido en localStorage
// para sobrevivir reloads del candidato.
const ID_MAP_KEY = 'hr_eval_id_map';

function readIdMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ID_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeIdMap(map: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

function getEvaluationId(sessionId: string): string | null {
  return readIdMap()[sessionId] ?? null;
}

function rememberEvaluationId(sessionId: string, id: string): void {
  const map = readIdMap();
  map[sessionId] = id;
  writeIdMap(map);
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toCreatePayload(state: EvaluationState): EvaluationCreateBody {
  return {
    session_id:      state.sessionId,
    name:            state.name,
    phone:           state.phone,
    email:           state.email || null,
    age:             state.age,
    location:        state.location || null,
    marital_status:  state.maritalStatus || null,
    daily_calls:     state.dailyCalls || null,
    last_income:     state.lastIncome || null,
    exit_reason:     state.exitReason || null,
    highlight:       state.highlight || null,
    cv_url:          state.cvUrl || null,
    linkedin_url:    state.linkedinUrl || null,
    score_total:     state.totalScore,
    score_breakdown: state.scores,
    flags:           state.flags as unknown as Record<string, unknown>,
    status:          state.status,
    current_step:    state.currentStep,
    user_agent:      typeof navigator !== 'undefined' ? navigator.userAgent : null,
    answers:         buildAnswers(state),
    completed_at:    state.completedAt || null,
  };
}

function toUpdatePayload(state: EvaluationState): EvaluationUpdateBody {
  return {
    status:          state.status,
    disqualify_reason: state.disqualifyReason,
    assigned_to:     state.assignedTo || null,
    score_total:     state.totalScore,
    score_breakdown: state.scores,
    flags:           state.flags as unknown as Record<string, unknown>,
    current_step:    state.currentStep,
    completed_at:    state.completedAt || null,
    answers:         buildAnswers(state),
  };
}

function buildAnswers(state: EvaluationState): Record<string, unknown> {
  return {
    availability:          state.availability,
    experience:            state.experience,
    closingRole:           state.closingRole,
    closingVolume:         state.closingVolume,
    objectionResponse:     state.objectionResponse,
    autonomyDesc:          state.autonomyDesc,
    philosophy:            state.philosophy,
    philosophyExplanation: state.philosophyExplanation,
    verificationAnswer:    state.verificationAnswer,
    jobCount:              state.jobCount,
    financialSituation:    state.financialSituation,
  };
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Sincroniza el estado actual con el backend.
 * - Si no existe `id` aún para esta sesión → POST (crear).
 * - Si ya existe → PATCH (actualizar).
 * Fire-and-forget: no bloquea la UI.
 */
export async function syncToSupabase(state: EvaluationState): Promise<void> {
  try {
    const existingId = getEvaluationId(state.sessionId);
    if (!existingId) {
      const res = await apiEvaluations.create(toCreatePayload(state));
      if (res?.id) rememberEvaluationId(state.sessionId, res.id);
      return;
    }
    await apiEvaluations.update(existingId, toUpdatePayload(state));
  } catch (e) {
    // Si el POST falló por duplicado (otra pestaña ya creó la sesión), el
    // siguiente sync intentará un PATCH si recuperamos el id en algún punto.
    // Por ahora solo logueamos en dev — el flujo del candidato no debe romperse.
    if (import.meta.env.DEV) {
      const msg = e instanceof ApiError ? `${e.status} ${e.message}` : String(e);
      console.error('[useSession.sync]', msg);
    }
  }
}

/**
 * Guarda el estado final al completar o descartar la evaluación.
 * Retorna `error` para que la UI pueda mostrar un toast si algo falla.
 */
export async function completeInSupabase(state: EvaluationState): Promise<{ error: string | null }> {
  try {
    const existingId = getEvaluationId(state.sessionId);
    if (!existingId) {
      const res = await apiEvaluations.create(toCreatePayload(state));
      if (res?.id) rememberEvaluationId(state.sessionId, res.id);
      return { error: null };
    }
    await apiEvaluations.update(existingId, toUpdatePayload(state));
    return { error: null };
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
    if (import.meta.env.DEV) console.error('[useSession.complete]', msg);
    return { error: msg };
  }
}

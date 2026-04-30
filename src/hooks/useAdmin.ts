// src/hooks/useAdmin.ts
// Listado y mutaciones de evaluaciones para el dashboard admin / portal recruiter.
// Migrado a backend Express+MySQL via `@/lib/api`.

import { useState, useEffect, useCallback } from 'react';
import {
  evaluations as apiEvaluations,
  briefing as apiBriefing,
  hiredStatus as apiHiredStatus,
  analytics as apiAnalytics,
  ApiError,
  type EvaluationListItem,
  type BriefingResponse,
  type HiredStatus,
  type FunnelAnalytics,
} from '@/lib/api';

export interface AdminEvaluation {
  id: string;
  session_id: string;
  created_at: string;
  completed_at: string | null;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  location: string | null;
  marital_status: string | null;
  daily_calls: number | null;
  last_income: number | null;
  exit_reason: string | null;
  highlight: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  score_total: number;
  score_breakdown: Record<string, number>;
  flags: Record<string, boolean>;
  status: 'en_progreso' | 'elite' | 'calificado' | 'potencial' | 'descartado';
  disqualify_reason: string | null;
  current_step: number;
  last_activity: string;
  answers: Record<string, string> | null;
  assigned_to: string | null;
  interview_status: string | null;
  interview_date: string | null;
  recruiter_notes: string | null;
}

/**
 * Actualiza datos de entrevista para una evaluación.
 * Mantenemos la firma `(sessionId, data)` por compatibilidad con la UI existente,
 * aunque internamente resolvemos a `id` (PK del backend) cuando es necesario.
 */
export async function updateInterviewData(
  evaluationId: string,
  data: { interview_status?: string; interview_date?: string; recruiter_notes?: string; assigned_to?: string }
): Promise<{ error: string | null }> {
  try {
    await apiEvaluations.update(evaluationId, data);
    return { error: null };
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
    return { error: msg };
  }
}

interface UseAdminOptions {
  status?: string;
  assigned_to?: string;
  limit?: number;
}

export function useAdmin(authenticated: boolean, options: UseAdminOptions = {}) {
  const [evaluations, setEvaluations] = useState<AdminEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { status, assigned_to, limit } = options;

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiEvaluations.list({
        status,
        assigned_to,
        limit: limit ?? 500,
      });
      // El listado del backend trae un subset de campos; el dashboard hace
      // filtrado/visualización tolerante a nulos. Casteamos para conservar
      // la forma esperada por la UI.
      const rows = (res.rows ?? []).map((r: EvaluationListItem) => ({
        ...r,
        marital_status:    null,
        daily_calls:       null,
        last_income:       null,
        exit_reason:       null,
        highlight:         null,
        cv_url:            null,
        linkedin_url:      null,
        score_breakdown:   {},
        flags:             {},
        disqualify_reason: null,
        current_step:      0,
        last_activity:     r.created_at,
        answers:           null,
        recruiter_notes:   null,
      })) as AdminEvaluation[];
      setEvaluations(rows);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [status, assigned_to, limit]);

  useEffect(() => {
    if (authenticated) {
      fetchEvaluations();
    }
  }, [authenticated, fetchEvaluations]);

  return { evaluations, loading, error, refetch: fetchEvaluations };
}

/**
 * Carga el detalle completo de una evaluación (usado por el modal del admin).
 */
export async function fetchEvaluationDetail(id: string): Promise<AdminEvaluation> {
  const data = await apiEvaluations.get(id);
  // Normaliza campos JSON que MySQL puede devolver como string.
  const parseJson = (v: unknown): Record<string, unknown> => {
    if (v == null) return {};
    if (typeof v === 'string') {
      try { return JSON.parse(v) as Record<string, unknown>; } catch { return {}; }
    }
    if (typeof v === 'object') return v as Record<string, unknown>;
    return {};
  };
  return {
    ...data,
    score_breakdown: parseJson(data.score_breakdown) as Record<string, number>,
    flags:           parseJson(data.flags) as Record<string, boolean>,
    answers:         (parseJson(data.answers) as Record<string, string>),
    current_step:    data.current_step ?? 0,
    last_activity:   data.last_activity ?? data.created_at,
  } as AdminEvaluation;
}

// ─── Phase 3 hooks ────────────────────────────────────────────────────────────

/**
 * Hook to generate or use existing briefing for a candidate.
 * Returns the briefing state and a generate function.
 */
export function useBriefing(
  evaluationId: string | null,
  initial?: { summary?: string | null; questions?: string[] | null; flags?: { green: string[]; red: string[] } | null }
) {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(
    initial?.summary
      ? { summary: initial.summary, questions: initial.questions ?? [], flags: initial.flags ?? { green: [], red: [] } }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!evaluationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiBriefing.generate(evaluationId);
      setBriefing(res);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  return { briefing, loading, error, generate, setBriefing };
}

/**
 * Hook to update the hired status of a candidate.
 */
export function useUpdateHiredStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (
    evaluationId: string,
    status: HiredStatus,
    notes?: string | null
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiHiredStatus.update(evaluationId, { hired_status: status, hired_notes: notes });
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

/**
 * Hook to load funnel analytics.
 */
export function useFunnel(company?: string) {
  const [data, setData] = useState<FunnelAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAnalytics.funnel(company);
      setData(res);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

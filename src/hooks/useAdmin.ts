import { useState, useEffect } from 'react';
import { supabase as supabaseAdmin } from '@/lib/supabase';

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
}

export function useAdmin(authenticated: boolean) {
  const [evaluations, setEvaluations] = useState<AdminEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabaseAdmin
      .from('evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEvaluations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authenticated) {
      fetchEvaluations();
    }
  }, [authenticated]);

  return { evaluations, loading, error, refetch: fetchEvaluations };
}

import { supabase } from './supabase';

export interface RecruiterAssignment {
  label: string;
  calendar_url: string;
}

export async function assignRecruiter(): Promise<RecruiterAssignment | null> {
  const { data, error } = await supabase.rpc('assign_recruiter');
  if (error) {
    if (import.meta.env.DEV) console.error('[assignRecruiter]', error.message);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0] as RecruiterAssignment;
}

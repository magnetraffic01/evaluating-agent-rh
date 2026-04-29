// src/lib/recruiters.ts
// Asignación weighted round-robin via backend Express.

import { recruiters as apiRecruiters, ApiError } from '@/lib/api';

export interface RecruiterAssignment {
  label: string;
  calendar_url: string;
}

export async function assignRecruiter(): Promise<RecruiterAssignment | null> {
  try {
    const data = await apiRecruiters.assign();
    if (!data || !data.label || !data.calendar_url) return null;
    return { label: data.label, calendar_url: data.calendar_url };
  } catch (e) {
    if (import.meta.env.DEV) {
      const msg = e instanceof ApiError ? e.message : String(e);
      console.error('[assignRecruiter]', msg);
    }
    return null;
  }
}

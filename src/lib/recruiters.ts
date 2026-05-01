// src/lib/recruiters.ts
// Asignación weighted round-robin via backend Express.
// Phase 5: ahora acepta `company` para filtrar reclutadores que atienden
// esa empresa (hr_recruiter_companies). Sin company → comportamiento legacy.

import { recruiters as apiRecruiters, ApiError } from '@/lib/api';
import type { Company } from '@/types/evaluation';

export interface RecruiterAssignment {
  label: string;
  calendar_url: string;
}

export async function assignRecruiter(company?: Company): Promise<RecruiterAssignment | null> {
  try {
    const data = await apiRecruiters.assign(company || null);
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

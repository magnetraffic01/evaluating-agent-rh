import { EvaluationState, EvaluationStatus } from '@/types/evaluation';

export const THRESHOLDS = {
  ELITE: 110,
  CALIFICADO: 80,
  POTENCIAL: 55,
};

export function calculateFinalStatus(state: EvaluationState): EvaluationStatus {
  if (state.disqualifyReason) return 'descartado';
  const total = calculateTotalScore(state);
  if (total >= THRESHOLDS.ELITE) return 'elite';
  if (total >= THRESHOLDS.CALIFICADO) return 'calificado';
  if (total >= THRESHOLDS.POTENCIAL) return 'potencial';
  return 'descartado';
}

export function calculateTotalScore(state: EvaluationState): number {
  const s = state.scores;
  return s.E1_cierre + s.E1_volumen + s.E3_copywriting + s.E4_objeciones +
    s.E5_autonomia + s.E6_filosofia + s.C1_estabilidad + s.V1_penalty + s.E2_penalty;
}

export function scoreClosingRole(answer: string): number {
  switch (answer) {
    case 'closer_direct': return 25;
    case 'closer_support': return 15;
    case 'demos_only': return 5;
    case 'no_closing': return 0;
    default: return 0;
  }
}

export function isClosingRoleDisqualify(answer: string): boolean {
  return answer === 'no_closing';
}

export function scoreVolume(answer: string): { score: number; dailyCalls: number } {
  switch (answer) {
    case '40_plus': return { score: 25, dailyCalls: 40 };
    case '20_39': return { score: 18, dailyCalls: 30 };
    case '10_19': return { score: 10, dailyCalls: 15 };
    case 'less_10': return { score: 0, dailyCalls: 5 };
    default: return { score: 0, dailyCalls: 0 };
  }
}

export function scoreIncomePenalty(income: number, exitReason: string): number {
  if (income >= 800 && exitReason.trim().length < 30) return -8;
  return 0;
}

export function scoreReactivation(text: string): { score: number; disqualify: boolean } {
  const t = text.toLowerCase().trim();
  if (!t || t.length < 10) return { score: 0, disqualify: true };

  const hasHook = /(?:imagina|piensa|recuerd|oportunidad|perder|últim|exclusiv|beneficio|result|transform)/i.test(t);
  const hasUrgency = /(?:urgent|últim|hoy|ahora|mañana|plazo|limit|quedan|cupo)/i.test(t);
  const hasCuriosity = /(?:\?|pregunt|sab[eí]|curi|qué pas|qué tal|notar|vi que)/i.test(t);
  const isGeneric = /^(hola|¿?sigues interesado|te interesa|qué tal|buenos días)/i.test(t);

  if (isGeneric && !hasHook && !hasUrgency) return { score: 10, disqualify: false };
  if (hasHook && (hasUrgency || hasCuriosity)) return { score: 20, disqualify: false };
  if (hasHook || hasUrgency || hasCuriosity) return { score: 15, disqualify: false };
  return { score: 12, disqualify: false };
}

export function scoreObjection(text: string): { score: number; disqualify: boolean } {
  const t = text.toLowerCase().trim();
  if (!t || t.length < 10) return { score: 0, disqualify: true };

  const offersDiscount = /(?:descuento|rebaj|baj.*precio|te hago.*precio|te lo dejo)/i.test(t);
  if (offersDiscount) return { score: 0, disqualify: true };

  const hasQuestion = /(?:\?|comparad|relación|qué.*signific|respecto|versus)/i.test(t);
  const hasValueDefense = /(?:valor|resultado|retorno|inversión|gananci|benefici|transform|ROI)/i.test(t);

  if (hasQuestion) return { score: 20, disqualify: false };
  if (hasValueDefense) return { score: 14, disqualify: false };
  return { score: 7, disqualify: false };
}

export function scoreAutonomy(text: string): { score: number; bajaEjecucion: boolean } {
  const t = text.toLowerCase().trim();
  if (!t || t.length < 20) return { score: 0, bajaEjecucion: true };

  const hasSystem = /(?:horario|rutina|agenda|bloque|organiz|planific|calendar|CRM|pipeline|sistema|método)/i.test(t);
  const hasTools = /(?:notion|trello|excel|sheet|asana|hubspot|salesforce|herramienta|app|software)/i.test(t);

  if (hasSystem && hasTools) return { score: 15, bajaEjecucion: false };
  if (hasSystem || hasTools) return { score: 10, bajaEjecucion: false };
  return { score: 0, bajaEjecucion: true };
}

export function scorePhilosophy(choice: string, explanation: string): number {
  const hasArgument = explanation.trim().length > 30;
  switch (choice) {
    case 'B': return hasArgument ? 20 : 12;
    case 'C': return hasArgument ? 12 : 8;
    case 'A': return hasArgument ? 5 : 0;
    default: return 0;
  }
}

export function philosophyPenalty(choice: string, explanation: string): number {
  if (choice === 'A' && explanation.trim().length < 30) return -10;
  return 0;
}

export function scoreStability(answer: string): { score: number; riesgoRetencion: boolean } {
  switch (answer) {
    case '1': return { score: 10, riesgoRetencion: false };
    case '2': return { score: 10, riesgoRetencion: false };
    case '3_plus': return { score: 5, riesgoRetencion: true };
    default: return { score: 0, riesgoRetencion: false };
  }
}

export function getHalfDailyCalls(dailyCalls: number): number {
  return Math.round(dailyCalls / 2);
}

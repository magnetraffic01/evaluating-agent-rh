export interface EvaluationState {
  sessionId: string;
  name: string;
  phone: string;
  currentStep: number;
  startTime: string;
  completedAt?: string;

  // Step data
  location: string;
  availability: string;
  experience: string;
  closingRole: string;
  closingVolume: string;
  dailyCalls: number;
  lastIncome: number;
  exitReason: string;
  reactivationMsg: string;
  objectionResponse: string;
  autonomyDesc: string;
  philosophy: string;
  philosophyExplanation: string;
  verificationAnswer: string;
  jobCount: string;
  financialSituation: string;
  email: string;
  age: number | null;
  maritalStatus: string;
  cvUrl: string;
  linkedinUrl: string;
  assignedTo: string;

  // Scoring
  scores: ScoreBreakdown;
  totalScore: number;
  flags: EvaluationFlags;
  disqualifyReason: string | null;
  status: EvaluationStatus;
  highlight: string;
}

export interface ScoreBreakdown {
  E1_cierre: number;
  E1_volumen: number;
  E3_copywriting: number;
  E4_objeciones: number;
  E5_autonomia: number;
  E6_filosofia: number;
  C1_estabilidad: number;
  V1_penalty: number;
  E2_penalty: number;
}

export interface EvaluationFlags {
  consintio_proceso: boolean;
  narrativa_inconsistente: boolean;
  baja_ejecucion: boolean;
  riesgo_retencion: boolean;
  b_verif_aplicada: boolean;
}

export type EvaluationStatus = 'en_progreso' | 'elite' | 'calificado' | 'potencial' | 'descartado';

export const DISQUALIFY_REASONS: Record<string, string> = {
  'rechazo_inicial': 'disposición para iniciar el proceso',
  'sin_disponibilidad': 'disponibilidad de tiempo completo',
  'sin_ventas_telefonicas': 'experiencia en ventas remotas',
  'sin_cierre_directo': 'experiencia en cierre directo de ventas',
  'sin_copywriting': 'habilidades de seguimiento activo',
  'sin_objeciones': 'técnicas de manejo de objeciones',
  'sin_runway': 'estabilidad durante el período de arranque',
  'no_envio_cv': 'documentación completa del perfil',
};

export function createInitialState(name: string, phone: string): EvaluationState {
  return {
    sessionId: crypto.randomUUID(),
    name,
    phone,
    currentStep: 0,
    startTime: new Date().toISOString(),
    location: '',
    availability: '',
    experience: '',
    closingRole: '',
    closingVolume: '',
    dailyCalls: 0,
    lastIncome: 0,
    exitReason: '',
    reactivationMsg: '',
    objectionResponse: '',
    autonomyDesc: '',
    philosophy: '',
    philosophyExplanation: '',
    verificationAnswer: '',
    jobCount: '',
    financialSituation: '',
    email: '',
    age: null,
    maritalStatus: '',
    cvUrl: '',
    linkedinUrl: '',
    assignedTo: '',
    scores: {
      E1_cierre: 0,
      E1_volumen: 0,
      E3_copywriting: 0,
      E4_objeciones: 0,
      E5_autonomia: 0,
      E6_filosofia: 0,
      C1_estabilidad: 0,
      V1_penalty: 0,
      E2_penalty: 0,
    },
    totalScore: 0,
    flags: {
      consintio_proceso: false,
      narrativa_inconsistente: false,
      baja_ejecucion: false,
      riesgo_retencion: false,
      b_verif_aplicada: false,
    },
    disqualifyReason: null,
    status: 'en_progreso',
    highlight: '',
  };
}

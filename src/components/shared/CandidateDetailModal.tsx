// src/components/shared/CandidateDetailModal.tsx
// Modal de detalle de candidato compartido entre /admin y /portal.
//
// El admin y el reclutador ven exactamente las mismas 5 pestañas y las mismas
// tarjetas LLM/Briefing/Score. La diferencia se controla via la prop `mode`:
//
//   - admin     -> permite editar `assigned_to` (reasignación) y todo lo demás.
//   - recruiter -> oculta el campo de reasignación. Resto de campos editables
//                  (interview_status, interview_date, recruiter_notes,
//                  hired_status) quedan habilitados para que el reclutador
//                  marque su propio progreso.
//
// La carga del detalle (Phase 3 fields, answers, briefing, etc.) es interna
// del modal y se dispara al montar. Funciona dado el tipo mínimo de "list-item"
// que cada página le pasa.

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X, ChevronDown, ExternalLink, Printer, Calendar, User, FileText,
  BarChart2, MessageSquare, Video,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useBriefing, fetchEvaluationDetail, updateInterviewData,
  type AdminEvaluation,
} from '@/hooks/useAdmin';
import { BriefingCard } from '@/components/admin/BriefingCard';
import { LLMResponseCard } from '@/components/admin/LLMResponseCard';
import { HiredStatusButtons } from '@/components/admin/HiredStatusButtons';
import { toast } from 'sonner';
import { ApiError, API_BASE_URL, type HiredStatus } from '@/lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CandidateModalMode = 'admin' | 'recruiter';

/**
 * Forma mínima que ambas páginas (Admin/Portal) pueden satisfacer sin casteos.
 * El modal carga el detalle completo internamente vía `fetchEvaluationDetail`
 * usando `id` (preferido) o `session_id` como fallback.
 *
 * Nota: el listado de Portal no incluye `id` en su tipo `PortalEvaluation`,
 * pero los items que vienen del backend SÍ lo traen (campo opcional). Lo
 * declaramos opcional para que ambos tipos sean asignables.
 */
export interface CandidateModalInput {
  id?: string;
  session_id: string;
  name: string;
  phone: string;
  email: string | null;
  location: string | null;
  score_total: number;
  status: 'en_progreso' | 'elite' | 'calificado' | 'potencial' | 'descartado';
  assigned_to: string | null;
  interview_status: string | null;
  interview_date: string | null;
  recruiter_notes: string | null;
  created_at: string;
  // Campos opcionales que el admin trae siempre y el portal a veces:
  age?: number | null;
  marital_status?: string | null;
  daily_calls?: number | null;
  last_income?: number | null;
  exit_reason?: string | null;
  highlight?: string | null;
  cv_url?: string | null;
  linkedin_url?: string | null;
  score_breakdown?: Record<string, number> | null;
  flags?: Record<string, boolean> | null;
  disqualify_reason?: string | null;
  answers?: Record<string, unknown> | null;
  completed_at?: string | null;
  hired_status?: 'hired' | 'declined' | 'no_show' | null;
}

interface CandidateDetailModalProps {
  candidate: CandidateModalInput;
  mode: CandidateModalMode;
  onClose: () => void;
  /** Permite a la página padre sincronizar la fila del listado tras un guardado. */
  onUpdate?: (updated: Partial<AdminEvaluation>) => void;
}

// ─── Configs / labels ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { labelKey: string; className: string; dot: string }> = {
  elite:       { labelKey: 'admin_status_elite',       className: 'bg-primary/15 text-primary border-primary/40',             dot: 'bg-primary'          },
  calificado:  { labelKey: 'admin_status_calificado',  className: 'bg-success/15 text-success border-success/40',             dot: 'bg-success'          },
  potencial:   { labelKey: 'admin_status_potencial',   className: 'bg-warning/15 text-warning border-warning/40',             dot: 'bg-warning'          },
  descartado:  { labelKey: 'admin_status_descartado',  className: 'bg-destructive/15 text-destructive border-destructive/40', dot: 'bg-destructive'      },
  en_progreso: { labelKey: 'admin_status_en_progreso', className: 'bg-muted text-muted-foreground border-border',             dot: 'bg-muted-foreground' },
};

const INTERVIEW_STATUS_CONFIG: Record<string, { labelKey: string; color: string }> = {
  agendada:                  { labelKey: 'admin_interview_agendada',        color: 'text-primary'     },
  entrevistado:              { labelKey: 'admin_interview_entrevistado',     color: 'text-success'     },
  no_asistio:                { labelKey: 'admin_interview_no_asistio',       color: 'text-destructive' },
  reprogramado:              { labelKey: 'admin_interview_reprogramado',     color: 'text-warning'     },
  rechazado_post_entrevista: { labelKey: 'admin_interview_rechazado_post',   color: 'text-destructive' },
};

const SCORE_LABEL_KEYS: Record<string, string> = {
  E1_cierre:      'admin_score_label_E1_cierre',
  E1_volumen:     'admin_score_label_E1_volumen',
  E3_copywriting: 'admin_score_label_E3_copywriting',
  E4_objeciones:  'admin_score_label_E4_objeciones',
  E5_autonomia:   'admin_score_label_E5_autonomia',
  E6_filosofia:   'admin_score_label_E6_filosofia',
  C1_estabilidad: 'admin_score_label_C1_estabilidad',
  V1_penalty:     'admin_score_label_V1_penalty',
  E2_penalty:     'admin_score_label_E2_penalty',
};

const SCORE_LABELS_ES: Record<string, string> = {
  E1_cierre:      'Cierre directo',
  E1_volumen:     'Volumen llamadas',
  E3_copywriting: 'Copywriting',
  E4_objeciones:  'Objeciones',
  E5_autonomia:   'Autonomía',
  E6_filosofia:   'Filosofía de ventas',
  C1_estabilidad: 'Estabilidad laboral',
  V1_penalty:     'Penalización consistencia',
  E2_penalty:     'Penalización narrativa',
};

const SCORE_MAX: Record<string, number> = {
  E1_cierre: 25, E1_volumen: 25, E3_copywriting: 20, E4_objeciones: 20,
  E5_autonomia: 15, E6_filosofia: 20, C1_estabilidad: 10,
  V1_penalty: 10, E2_penalty: 8,
};

const SCORE_CRITERIA: Record<string, Record<number, string>> = {
  E1_cierre:      { 25: 'Cierra y cobra directamente', 15: 'Apoya el cierre', 5: 'Solo demos/presentaciones', 0: 'Sin cierre directo' },
  E1_volumen:     { 25: 'Más de 40 llamadas/día', 18: 'Entre 20 y 39 llamadas/día', 10: 'Entre 10 y 19 llamadas/día', 0: 'Menos de 10 llamadas/día' },
  E3_copywriting: { 20: 'Gancho con urgencia (top)', 10: 'Mensaje genérico funcional', 0: 'No sabe cómo reactivar' },
  E4_objeciones:  { 20: 'Redirige con pregunta', 14: 'Defiende el valor del producto', 7: 'Respuesta genérica', 0: 'Ofrece descuento' },
  E5_autonomia:   { 15: 'Sistema propio de seguimiento', 0: 'Vago o dependiente de instrucciones' },
  E6_filosofia:   { 20: 'Precalifica profundo', 12: 'Precalifica básico', 5: 'Convierte con técnica', 0: 'Convierte sin argumento' },
  C1_estabilidad: { 10: '1–2 trabajos anteriores', 5: '3 o más trabajos (riesgo retención)' },
  V1_penalty:     { '-10': 'Aceptó cifra falsa (–10 pts)', 0: 'Sin penalización' },
  E2_penalty:     { '-8': 'Narrativa inconsistente (–8 pts)', 0: 'Sin penalización' },
};

const ANSWER_LABELS: Record<string, string> = {
  availability:          'Disponibilidad horaria',
  experience:            'Experiencia en ventas',
  closingRole:           'Rol en el cierre',
  closingVolume:         'Volumen de ventas cerradas',
  objectionResponse:     'Manejo de objeción',
  autonomyDesc:          'Sistema de seguimiento propio',
  philosophy:            'Filosofía de ventas (opción)',
  philosophyExplanation: 'Filosofía de ventas (explicación)',
  verificationAnswer:    'Respuesta de verificación',
  jobCount:              'Cantidad de trabajos anteriores',
  financialSituation:    'Situación financiera actual',
};

// ─── Tab type ─────────────────────────────────────────────────────────────────

type ModalTab = 'resumen' | 'qa' | 'score' | 'entrevista' | 'candidato';

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const isNegative = value < 0;
  const pct = Math.abs(value) / max * 100;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${isNegative ? 'bg-destructive' : 'bg-primary'}`}
        />
      </div>
      <span className={`w-8 text-right font-semibold ${isNegative ? 'text-destructive' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

function CVLinks({ candidate }: { candidate: { cv_url?: string | null; linkedin_url?: string | null } }) {
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const loading = false;

  useEffect(() => {
    const raw = candidate.cv_url;
    if (!raw) { setCvUrl(null); return; }
    let normalized = raw;
    // Bug fix 2026-05-05 (heredado de Admin.tsx): hr-api.magnetraffic.com nunca
    // se configuró en DNS; las URLs absolutas que apuntan a ese subdominio se
    // reescriben para que sirvan desde el dominio real del backend.
    if (/https?:\/\/hr-api\.magnetraffic\.com\b/i.test(normalized)) {
      try {
        const u = new URL(normalized);
        normalized = `${API_BASE_URL}${u.pathname}${u.search}`;
      } catch {
        normalized = normalized.replace(/^https?:\/\/hr-api\.magnetraffic\.com/i, API_BASE_URL);
      }
    }
    if (/^https?:\/\//i.test(normalized)) {
      setCvUrl(normalized);
    } else if (normalized.startsWith('/')) {
      setCvUrl(`${API_BASE_URL}${normalized}`);
    } else {
      setCvUrl(`${API_BASE_URL}/files/${normalized}`);
    }
  }, [candidate.cv_url]);

  if (!candidate.linkedin_url && !candidate.cv_url) return null;

  return (
    <div>
      <h4 className="text-foreground font-semibold mb-3 text-sm">CV / LinkedIn</h4>
      <div className="flex flex-col gap-2">
        {candidate.linkedin_url && (
          <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline text-sm">
            <ExternalLink size={13} />{candidate.linkedin_url}
          </a>
        )}
        {candidate.cv_url && (
          loading
            ? <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                Generando enlace...
              </span>
            : cvUrl
              ? <a href={cvUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline text-sm">
                  <ExternalLink size={13} />Ver CV del candidato
                </a>
              : null
        )}
      </div>
    </div>
  );
}

function normalizeRecruiter(value: string | null | undefined): string | null {
  if (!value) return null;
  const map: Record<string, string> = {
    'y9etbqml6yxo6z3as8xw': 'Reclutador 1',
    'blcv7ez4gifnduyк1vry':  'Reclutador 2',
  };
  return map[value.toLowerCase()] ?? value;
}

// ─── Resumen automático ───────────────────────────────────────────────────────

interface SummaryInput {
  status: string;
  score_total: number;
  location?: string | null;
  age?: number | null;
  marital_status?: string | null;
  score_breakdown?: Record<string, number> | null;
  flags?: Record<string, boolean> | null;
  disqualify_reason?: string | null;
  daily_calls?: number | null;
  last_income?: number | null;
}

function buildSummary(c: SummaryInput): string {
  const lines: string[] = [];
  const statusLabelsEs: Record<string, string> = {
    elite: 'ELITE', calificado: 'CALIFICADO', potencial: 'POTENCIAL',
    descartado: 'DESCARTADO', en_progreso: 'EN PROGRESO',
  };
  const statusLabel = statusLabelsEs[c.status] || c.status;
  lines.push(`Resultado: ${statusLabel} — ${c.score_total} puntos.`);
  if (c.location) lines.push(`Ubicación: ${c.location}.`);
  if (c.age) lines.push(`Edad: ${c.age} años${c.marital_status ? `, ${c.marital_status}` : ''}.`);

  const strengths: string[] = [];
  if (c.score_breakdown) {
    for (const [key, val] of Object.entries(c.score_breakdown)) {
      const max = SCORE_MAX[key] || 25;
      if ((val as number) >= max * 0.8 && (val as number) > 0) {
        strengths.push(SCORE_LABELS_ES[key] || key);
      }
    }
  }
  if (strengths.length) lines.push(`Fortalezas destacadas: ${strengths.join(', ')}.`);

  const activeFlags: string[] = [];
  if (c.flags) {
    for (const [key, val] of Object.entries(c.flags)) {
      if (val && key !== 'consintio_proceso' && key !== 'b_verif_aplicada') {
        activeFlags.push(key.replace(/_/g, ' '));
      }
    }
  }
  if (activeFlags.length) lines.push(`Señales de riesgo: ${activeFlags.join(', ')}.`);

  if (c.disqualify_reason) lines.push(`Descartado por: ${c.disqualify_reason.replace(/_/g, ' ')}.`);
  if (c.daily_calls) lines.push(`Volumen declarado: ${c.daily_calls} llamadas/día.`);
  if (c.last_income) lines.push(`Último ingreso mensual: $${c.last_income.toLocaleString()}.`);

  if (c.status === 'elite' || c.status === 'calificado') {
    lines.push('Acción: Agendar entrevista de validación.');
  } else if (c.status === 'potencial') {
    lines.push('Acción: Contactar en 48 h para seguimiento.');
  } else if (c.status === 'descartado') {
    lines.push('Acción: No procede. Archivar.');
  }
  return lines.join(' ');
}

// ─── Forma extendida con campos Phase 3 ───────────────────────────────────────

interface CandidateExt extends CandidateModalInput {
  briefing_summary?: string | null;
  briefing_questions?: string[] | null;
  briefing_flags?: { green: string[]; red: string[] } | null;
  hired_notes?: string | null;
  company?: string | null;
  device_type?: string | null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CandidateDetailModal({
  candidate: candidateProp,
  mode,
  onClose,
  onUpdate,
}: CandidateDetailModalProps) {
  const { t } = useLanguage();
  const isAdmin = mode === 'admin';

  const [activeTab, setActiveTab] = useState<ModalTab>('candidato');
  const [interviewStatus, setInterviewStatus] = useState(candidateProp.interview_status || '');
  const [interviewDate, setInterviewDate] = useState(
    candidateProp.interview_date ? candidateProp.interview_date.slice(0, 16) : ''
  );
  const [recruiterNotes, setRecruiterNotes] = useState(candidateProp.recruiter_notes || '');
  const [assignedTo, setAssignedTo] = useState(candidateProp.assigned_to || '');
  const [saving, setSaving] = useState(false);

  // Detalle completo (Phase 3 + answers + score_breakdown).
  const [candidate, setCandidate] = useState<CandidateExt>(candidateProp);
  const [detailLoading, setDetailLoading] = useState(false);

  // Identificador efectivo a fetchar (id PK preferido sobre session_id).
  const idForDetail = candidateProp.id ?? candidateProp.session_id;
  // Identificador para mutaciones (PATCH /api/hr/evaluations/:id requiere id PK).
  const idForUpdates = candidateProp.id ?? candidateProp.session_id;

  // Carga el detalle completo al montar.
  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    fetchEvaluationDetail(idForDetail)
      .then(full => {
        if (cancelled) return;
        // Mezclamos el listado mínimo con el detalle completo. El detalle gana.
        setCandidate(prev => ({ ...prev, ...(full as unknown as CandidateExt) }));
      })
      .catch(() => { /* tolerar — usamos lo que vino del listado */ })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [idForDetail]);

  // Briefing — sembrado con lo que ya trae el detalle.
  const {
    briefing,
    loading: briefingLoading,
    error: briefingError,
    generate: generateBriefing,
    setBriefing,
  } = useBriefing(idForDetail, {
    summary:   candidate.briefing_summary,
    questions: candidate.briefing_questions,
    flags:     candidate.briefing_flags,
  });

  // Cuando el detalle llega, sincroniza el briefing local.
  useEffect(() => {
    if (candidate.briefing_summary) {
      setBriefing({
        summary:   candidate.briefing_summary,
        questions: candidate.briefing_questions ?? [],
        flags:     candidate.briefing_flags ?? { green: [], red: [] },
      });
    }
  }, [candidate.briefing_summary, candidate.briefing_questions, candidate.briefing_flags, setBriefing]);

  // Si el recruiter recibe 401 al generar briefing, ocultamos el botón.
  const [canGenerateBriefing, setCanGenerateBriefing] = useState(true);
  const handleGenerateBriefing = useCallback(async () => {
    try {
      await generateBriefing();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && mode === 'recruiter') {
        setCanGenerateBriefing(false);
      }
    }
  }, [generateBriefing, mode]);

  // Hired status local.
  const [hiredStatus, setHiredStatus] = useState<HiredStatus>(
    (candidate.hired_status as HiredStatus) ?? null
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveInterview = useCallback(async (patch: {
    interview_status?: string;
    interview_date?: string;
    recruiter_notes?: string;
    assigned_to?: string;
  }) => {
    setSaving(true);
    const result = await updateInterviewData(idForUpdates, patch);
    if (result.error) {
      toast.error(t('admin_modal_save_error', { error: result.error }));
    }
    onUpdate?.(patch);
    setSaving(false);
  }, [idForUpdates, onUpdate, t]);

  const handleStatusChange = (val: string) => {
    setInterviewStatus(val);
    saveInterview({ interview_status: val || undefined });
  };

  const handleDateChange = (val: string) => {
    setInterviewDate(val);
    saveInterview({ interview_date: val ? new Date(val).toISOString() : undefined });
  };

  const handleNotesChange = (val: string) => {
    setRecruiterNotes(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveInterview({ recruiter_notes: val });
    }, 800);
  };

  const handleAssignedToChange = (val: string) => {
    // Solo accesible en modo admin.
    setAssignedTo(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveInterview({ assigned_to: val });
    }, 800);
  };

  const handlePrint = () => {
    window.print();
  };

  const cfg = STATUS_CONFIG[candidate.status] || STATUS_CONFIG.descartado;
  const summary = buildSummary({
    status:            candidate.status,
    score_total:       candidate.score_total,
    location:          candidate.location,
    age:               candidate.age,
    marital_status:    candidate.marital_status,
    score_breakdown:   candidate.score_breakdown,
    flags:             candidate.flags,
    disqualify_reason: candidate.disqualify_reason,
    daily_calls:       candidate.daily_calls,
    last_income:       candidate.last_income,
  });

  const answersRecord = (candidate.answers ?? null) as Record<string, unknown> | null;
  const hasAnswers = !!answersRecord && Object.values(answersRecord).some(v => !!v);
  const answersStr = answersRecord as Record<string, string> | null;

  const reactivationMsg     = answersStr?.reactivationMsg ?? answersStr?.highlight ?? candidate.highlight ?? null;
  const reactivationReason  = answersStr?.reactivationReasoning ?? null;
  const objectionResponse   = answersStr?.objectionResponse ?? null;
  const objectionReasoning  = answersStr?.objectionReasoning ?? null;
  const autonomyDesc        = answersStr?.autonomyDesc ?? null;
  const autonomyReasoning   = answersStr?.autonomyReasoning ?? null;

  const sb = candidate.score_breakdown ?? {};
  const reactivationScore = (sb.E3_copywriting as number) ?? 0;
  const objectionScore    = (sb.E4_objeciones as number) ?? 0;
  const autonomyScore     = (sb.E5_autonomia as number) ?? 0;

  const TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'candidato',  label: t('admin_modal_tab_candidate'), icon: <User size={14} />          },
    { id: 'resumen',    label: t('admin_modal_tab_summary'),   icon: <FileText size={14} />      },
    { id: 'qa',         label: t('admin_modal_tab_answers'),   icon: <MessageSquare size={14} /> },
    { id: 'score',      label: t('admin_modal_tab_score'),     icon: <BarChart2 size={14} />     },
    { id: 'entrevista', label: t('admin_modal_tab_interview'), icon: <Calendar size={14} />      },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 print:static print:bg-white print:backdrop-blur-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.95, y: 16  }}
        transition={{ duration: 0.25 }}
        className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col print:max-h-none print:shadow-none print:border-0 print:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border/40 print:border-black">
          <div>
            <h3 className="text-foreground font-bold text-xl print:text-black">{candidate.name}</h3>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className} print:border-black print:text-black print:bg-white`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} print:bg-black`} />
                {t(cfg.labelKey)}
              </span>
              <span className="text-muted-foreground text-xs print:text-black">
                Score: <strong className="text-foreground print:text-black">{candidate.score_total} pts</strong>
              </span>
              {candidate.assigned_to && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground print:text-black">
                  <User size={11} />
                  {normalizeRecruiter(candidate.assigned_to)}
                </span>
              )}
              {candidate.interview_status && (
                <span className={`text-xs font-medium ${INTERVIEW_STATUS_CONFIG[candidate.interview_status]?.color || ''} print:text-black`}>
                  · {INTERVIEW_STATUS_CONFIG[candidate.interview_status]?.labelKey ? t(INTERVIEW_STATUS_CONFIG[candidate.interview_status].labelKey) : candidate.interview_status}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Printer size={13} />
              {t('admin_modal_print_btn')}
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 print:hidden">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
          {saving && <span className="ml-auto text-xs text-muted-foreground self-center">{t('admin_modal_saving')}</span>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5 print:overflow-visible">

          {/* ── TAB: CANDIDATO ── */}
          {activeTab === 'candidato' && (
            <div className="space-y-5">
              {detailLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  {t('admin_modal_loading_detail')}
                </div>
              )}

              {(candidate.company || candidate.device_type) && (
                <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                  {candidate.company && (
                    <span className="px-2 py-1 rounded-full bg-muted/20 border border-border/40">
                      {candidate.company}
                    </span>
                  )}
                  {candidate.device_type && (
                    <span className="px-2 py-1 rounded-full bg-muted/20 border border-border/40">
                      {candidate.device_type === 'mobile' ? 'Movil' : candidate.device_type === 'desktop' ? 'Desktop' : candidate.device_type}
                    </span>
                  )}
                </div>
              )}

              {/* Loom 60s video */}
              {(() => {
                const loomUrl = answersRecord?.loomUrl;
                if (typeof loomUrl !== 'string' || !loomUrl) return null;
                return (
                  <a
                    href={loomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-all"
                  >
                    <Video size={14} />
                    {t('admin_modal_loom_btn')}
                  </a>
                );
              })()}

              {/* Briefing */}
              <BriefingCard
                summary={briefing?.summary ?? null}
                questions={briefing?.questions ?? null}
                flags={briefing?.flags ?? null}
                generating={briefingLoading}
                error={briefingError}
                onGenerate={handleGenerateBriefing}
                canGenerate={canGenerateBriefing}
              />

              {/* LLM Responses */}
              {(reactivationMsg || objectionResponse || autonomyDesc) && (
                <div className="space-y-3">
                  <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider">
                    {t('admin_modal_llm_responses_title')}
                  </h4>
                  <LLMResponseCard
                    icon="📨"
                    label="Reactivacion"
                    score={reactivationScore}
                    maxScore={20}
                    response={reactivationMsg}
                    reasoning={reactivationReason}
                    highlight={candidate.highlight ?? null}
                  />
                  <LLMResponseCard
                    icon="💬"
                    label="Manejo de objecion"
                    score={objectionScore}
                    maxScore={20}
                    response={objectionResponse}
                    reasoning={objectionReasoning}
                  />
                  <LLMResponseCard
                    icon="🔧"
                    label="Autonomia"
                    score={autonomyScore}
                    maxScore={15}
                    response={autonomyDesc}
                    reasoning={autonomyReasoning}
                  />
                </div>
              )}

              {/* Hired Status — admin y recruiter ambos pueden marcarlo */}
              <HiredStatusButtons
                evaluationId={idForUpdates}
                currentStatus={hiredStatus}
                onStatusChange={(status, notes) => {
                  setHiredStatus(status);
                  setCandidate(prev => ({ ...prev, hired_status: status, hired_notes: notes }));
                  onUpdate?.({ hired_status: status } as Partial<AdminEvaluation>);
                }}
              />
            </div>
          )}

          {/* ── TAB: RESUMEN ── */}
          {activeTab === 'resumen' && (
            <div className="space-y-5 print:block">
              <div>
                <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">{t('admin_modal_candidate_data_title')}</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-muted/20 rounded-xl p-4 text-sm print:bg-white print:border print:border-black print:p-3">
                  {[
                    [t('admin_modal_field_phone'),       candidate.phone],
                    [t('admin_modal_field_email'),       candidate.email],
                    [t('admin_modal_field_location'),    candidate.location],
                    [t('admin_modal_field_age'),         candidate.age],
                    [t('admin_modal_field_marital'),     candidate.marital_status],
                    [t('admin_modal_field_calls_day'),   candidate.daily_calls],
                    [t('admin_modal_field_last_income'), candidate.last_income ? `$${candidate.last_income.toLocaleString()}` : null],
                    [t('admin_modal_field_eval_date'),   new Date(candidate.created_at).toLocaleString('es-MX')],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-muted-foreground text-xs print:text-black">{label}</span>
                      <p className="text-foreground font-medium mt-0.5 print:text-black">
                        {value || <span className="text-muted-foreground/50 text-xs print:text-black">—</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">{t('admin_modal_profile_summary_title')}</h4>
                <p className="text-muted-foreground text-sm bg-muted/10 rounded-xl p-4 leading-relaxed print:text-black print:bg-white print:border print:border-black print:p-3">
                  {summary}
                </p>
              </div>

              {candidate.exit_reason && (
                <div>
                  <h4 className="text-foreground font-semibold mb-2 text-sm print:text-black">{t('admin_modal_exit_reason_title')}</h4>
                  <p className="text-muted-foreground text-sm bg-muted/20 rounded-xl p-3 leading-relaxed print:text-black print:bg-white print:border print:border-black">
                    {candidate.exit_reason}
                  </p>
                </div>
              )}

              {candidate.highlight && (
                <div>
                  <h4 className="text-foreground font-semibold mb-2 text-sm print:text-black">{t('admin_modal_best_reactivation_title')}</h4>
                  <p className="text-muted-foreground text-sm bg-primary/5 border border-primary/20 rounded-xl p-3 leading-relaxed italic print:text-black print:bg-white print:border-black">
                    "{candidate.highlight}"
                  </p>
                </div>
              )}

              <CVLinks candidate={candidate} />
            </div>
          )}

          {/* ── TAB: RESPUESTAS ── */}
          {activeTab === 'qa' && (
            <div className="space-y-3 print:block">
              <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider print:text-black">{t('admin_modal_qa_title')}</h4>

              {/* Inbound Open */}
              {(() => {
                const inboundOpen = answersRecord?.inboundOpen;
                if (typeof inboundOpen !== 'string' || !inboundOpen) return null;
                return (
                  <section className="bg-muted/10 rounded-xl p-4 print:border print:border-black print:rounded-none print:mb-2">
                    <h5 className="text-xs text-muted-foreground mb-1 print:text-black uppercase tracking-wider">
                      {t('admin_qa_inbound_title')}
                    </h5>
                    <p className="text-foreground text-sm whitespace-pre-line leading-relaxed print:text-black">
                      {inboundOpen}
                    </p>
                  </section>
                );
              })()}

              {/* Idioma preferido */}
              {(() => {
                const languagePref = answersRecord?.languagePref;
                if (typeof languagePref !== 'string' || !languagePref) return null;
                const labelKey = languagePref === 'es_en' ? 'admin_qa_lang_bilingual' : 'admin_qa_lang_es_only';
                return (
                  <section className="bg-muted/10 rounded-xl p-4 print:border print:border-black print:rounded-none print:mb-2">
                    <h5 className="text-xs text-muted-foreground mb-2 print:text-black uppercase tracking-wider">
                      {t('admin_qa_language_title')}
                    </h5>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/30">
                      {t(labelKey)}
                    </span>
                  </section>
                );
              })()}

              {hasAnswers ? (
                Object.entries(answersRecord!).map(([key, value]) => {
                  if (!value) return null;
                  if (key === 'inboundOpen' || key === 'languagePref' || key === 'loomUrl') return null;
                  return (
                    <div key={key} className="bg-muted/10 rounded-xl p-4 print:border print:border-black print:rounded-none print:mb-2">
                      <p className="text-xs text-muted-foreground mb-1 print:text-black">{ANSWER_LABELS[key] || key}</p>
                      <p className="text-foreground text-sm leading-relaxed print:text-black">{String(value)}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm bg-muted/10 rounded-xl p-4">
                  {t('admin_modal_qa_empty')}
                </p>
              )}
            </div>
          )}

          {/* ── TAB: SCORE ── */}
          {activeTab === 'score' && (
            <div className="space-y-5 print:block">
              <div>
                <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">{t('admin_modal_score_breakdown_title')}</h4>
                <div className="space-y-2.5 bg-muted/10 rounded-xl p-4 print:border print:border-black print:rounded-none">
                  {candidate.score_breakdown && Object.entries(candidate.score_breakdown).map(([key, val]) => (
                    <ScoreBar
                      key={key}
                      label={SCORE_LABEL_KEYS[key] ? t(SCORE_LABEL_KEYS[key]) : key}
                      value={val as number}
                      max={SCORE_MAX[key] || 25}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">{t('admin_modal_score_criteria_title')}</h4>
                <div className="space-y-2">
                  {candidate.score_breakdown && Object.entries(candidate.score_breakdown).map(([key, val]) => {
                    const criteria = SCORE_CRITERIA[key];
                    if (!criteria) return null;
                    const score = val as number;
                    const label = criteria[score] || criteria[String(score) as unknown as number] || `${score} pts`;
                    return (
                      <div key={key} className="flex items-start gap-3 text-sm bg-muted/10 rounded-lg p-3 print:border print:border-black print:rounded-none print:mb-1">
                        <span className="text-muted-foreground w-36 shrink-0 print:text-black">{SCORE_LABEL_KEYS[key] ? t(SCORE_LABEL_KEYS[key]) : key}</span>
                        <span className={`flex-1 print:text-black ${score < 0 ? 'text-destructive' : score === 0 ? 'text-warning' : 'text-foreground'}`}>
                          {label}
                        </span>
                        <span className={`font-bold shrink-0 print:text-black ${score < 0 ? 'text-destructive' : 'text-primary'}`}>
                          {score > 0 ? `+${score}` : score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {candidate.flags && Object.entries(candidate.flags).some(([, v]) => v) && (
                <div>
                  <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">{t('admin_modal_score_flags_title')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(candidate.flags).filter(([, v]) => v).map(([key]) => (
                      <span key={key} className="px-3 py-1 rounded-full bg-warning/15 text-warning text-xs border border-warning/30 print:text-black print:bg-white print:border-black">
                        {key.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {candidate.disqualify_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 print:border-black print:bg-white">
                  <h4 className="text-destructive font-semibold mb-1 text-sm print:text-black">{t('admin_modal_score_discard_title')}</h4>
                  <p className="text-destructive/80 text-sm print:text-black">{candidate.disqualify_reason.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: ENTREVISTA ── */}
          {activeTab === 'entrevista' && (
            <div className="space-y-5 print:block">
              <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider print:text-black">{t('admin_modal_interview_title')}</h4>

              {/* Reasignación de reclutador — solo admin */}
              {isAdmin && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block print:text-black">{t('admin_modal_interview_recruiter_label')}</label>
                  <div className="relative print:hidden">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={assignedTo}
                      onChange={e => handleAssignedToChange(e.target.value)}
                      placeholder={t('admin_modal_interview_recruiter_placeholder')}
                      className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <p className="hidden print:block text-sm text-black border border-black p-3 rounded">
                    {assignedTo || t('admin_modal_interview_unassigned')}
                  </p>
                </div>
              )}

              {/* Estado de la entrevista */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block print:text-black">{t('admin_modal_interview_status_label')}</label>
                <div className="relative print:hidden">
                  <select
                    value={interviewStatus}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="w-full appearance-none bg-input border border-border rounded-xl px-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="">{t('admin_modal_interview_no_status')}</option>
                    {Object.entries(INTERVIEW_STATUS_CONFIG).map(([val, { labelKey }]) => (
                      <option key={val} value={val}>{t(labelKey)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <p className="hidden print:block text-sm text-black">
                  {interviewStatus ? t(INTERVIEW_STATUS_CONFIG[interviewStatus]?.labelKey) : t('admin_modal_interview_print_no_status')}
                </p>
              </div>

              {/* Fecha */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block print:text-black">{t('admin_modal_interview_date_label')}</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={e => handleDateChange(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all print:hidden"
                />
                <p className="hidden print:block text-sm text-black">
                  {interviewDate
                    ? new Date(interviewDate).toLocaleString('es-MX')
                    : t('admin_modal_interview_no_date')}
                </p>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block print:text-black">{t('admin_modal_interview_notes_label')}</label>
                <textarea
                  value={recruiterNotes}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder={t('admin_modal_interview_notes_placeholder')}
                  rows={5}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none print:hidden"
                />
                {recruiterNotes && (
                  <p className="hidden print:block text-sm text-black whitespace-pre-wrap border border-black p-3">
                    {recruiterNotes}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}

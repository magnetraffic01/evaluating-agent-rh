import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, RefreshCw, ChevronDown, ExternalLink, AlertCircle, Printer, Calendar, User, FileText, BarChart2, MessageSquare } from 'lucide-react';
import MagnetLogo from '@/components/MagnetLogo';
import { useAdmin, AdminEvaluation, updateInterviewData } from '@/hooks/useAdmin';
import { supabase as supabaseAdmin } from '@/lib/supabase';

// ─── Constantes ────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Info2026$';

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  elite:       { label: 'ELITE',       className: 'bg-primary/15 text-primary border-primary/40',             dot: 'bg-primary'          },
  calificado:  { label: 'CALIFICADO',  className: 'bg-success/15 text-success border-success/40',             dot: 'bg-success'          },
  potencial:   { label: 'POTENCIAL',   className: 'bg-warning/15 text-warning border-warning/40',             dot: 'bg-warning'          },
  descartado:  { label: 'DESCARTADO',  className: 'bg-destructive/15 text-destructive border-destructive/40', dot: 'bg-destructive'      },
  en_progreso: { label: 'EN PROGRESO', className: 'bg-muted text-muted-foreground border-border',             dot: 'bg-muted-foreground' },
};

const INTERVIEW_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  agendada:                  { label: 'Agendada',                  color: 'text-primary'     },
  entrevistado:              { label: 'Entrevistado',              color: 'text-success'     },
  no_asistio:                { label: 'No asistió',                color: 'text-destructive' },
  reprogramado:              { label: 'Reprogramado',              color: 'text-warning'     },
  rechazado_post_entrevista: { label: 'Rechazado post-entrevista', color: 'text-destructive' },
};

const SCORE_LABELS: Record<string, string> = {
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

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevRef.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <>{display}{suffix}</>;
}

// ─── Score bar ────────────────────────────────────────────────────────────────

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

// ─── CV Links ─────────────────────────────────────────────────────────────────

function CVLinks({ candidate }: { candidate: AdminEvaluation }) {
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isStoragePath = (url: string) => url && !url.startsWith('http') && url.includes('/');

  useEffect(() => {
    const raw = candidate.cv_url;
    if (!raw) return;
    if (isStoragePath(raw)) {
      setLoading(true);
      supabaseAdmin.storage.from('cvs').createSignedUrl(raw, 60 * 60)
        .then(({ data }) => { if (data?.signedUrl) setCvUrl(data.signedUrl); })
        .finally(() => setLoading(false));
    } else {
      setCvUrl(raw);
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

// ─── Generador de resumen ─────────────────────────────────────────────────────

function buildSummary(c: AdminEvaluation): string {
  const lines: string[] = [];

  const statusLabel = STATUS_CONFIG[c.status]?.label || c.status;
  lines.push(`Resultado: ${statusLabel} — ${c.score_total} puntos.`);

  if (c.location) lines.push(`Ubicación: ${c.location}.`);
  if (c.age) lines.push(`Edad: ${c.age} años${c.marital_status ? `, ${c.marital_status}` : ''}.`);

  // Fortalezas (bloques con puntaje ≥ 80% del máximo)
  const strengths: string[] = [];
  if (c.score_breakdown) {
    for (const [key, val] of Object.entries(c.score_breakdown)) {
      const max = SCORE_MAX[key] || 25;
      if ((val as number) >= max * 0.8 && (val as number) > 0) {
        strengths.push(SCORE_LABELS[key] || key);
      }
    }
  }
  if (strengths.length) lines.push(`Fortalezas destacadas: ${strengths.join(', ')}.`);

  // Flags de riesgo activos
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

  // Acción sugerida
  if (c.status === 'elite' || c.status === 'calificado') {
    lines.push('Acción: Agendar entrevista de validación.');
  } else if (c.status === 'potencial') {
    lines.push('Acción: Contactar en 48 h para seguimiento.');
  } else if (c.status === 'descartado') {
    lines.push('Acción: No procede. Archivar.');
  }

  return lines.join(' ');
}

// Normaliza IDs de GHL a etiquetas legibles (usada en tabla y modal)
function normalizeRecruiter(value: string | null | undefined): string | null {
  if (!value) return null;
  const map: Record<string, string> = {
    'y9etbqml6yxo6z3as8xw': 'Reclutador 1',
    'blcv7ez4gifnduyк1vry':  'Reclutador 2',
  };
  return map[value.toLowerCase()] ?? value;
}

// ─── Modal de detalle ─────────────────────────────────────────────────────────

type ModalTab = 'resumen' | 'qa' | 'score' | 'entrevista';

function DetailModal({ candidate, onClose, onUpdate }: {
  candidate: AdminEvaluation;
  onClose: () => void;
  onUpdate: (updated: Partial<AdminEvaluation>) => void;
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>('resumen');
  const [interviewStatus, setInterviewStatus] = useState(candidate.interview_status || '');
  const [interviewDate, setInterviewDate]     = useState(
    candidate.interview_date ? candidate.interview_date.slice(0, 16) : ''
  );
  const [recruiterNotes, setRecruiterNotes]   = useState(candidate.recruiter_notes || '');
  const [assignedTo, setAssignedTo]           = useState(candidate.assigned_to || '');
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveInterview = useCallback(async (patch: {
    interview_status?: string;
    interview_date?: string;
    recruiter_notes?: string;
    assigned_to?: string;
  }) => {
    setSaving(true);
    await updateInterviewData(candidate.session_id, patch);
    onUpdate(patch);
    setSaving(false);
  }, [candidate.session_id, onUpdate]);

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
  const summary = buildSummary(candidate);
  const hasAnswers = candidate.answers && Object.values(candidate.answers).some(v => v);

  const TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen',    label: 'Resumen',    icon: <FileText size={14} />    },
    { id: 'qa',         label: 'Respuestas', icon: <MessageSquare size={14} /> },
    { id: 'score',      label: 'Evaluación', icon: <BarChart2 size={14} />   },
    { id: 'entrevista', label: 'Entrevista', icon: <Calendar size={14} />    },
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
                {cfg.label}
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
                  · {INTERVIEW_STATUS_CONFIG[candidate.interview_status]?.label || candidate.interview_status}
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
              Imprimir / PDF
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
          {saving && <span className="ml-auto text-xs text-muted-foreground self-center">Guardando...</span>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5 print:overflow-visible">

          {/* ── TAB: RESUMEN ── */}
          {(activeTab === 'resumen') && (
            <div className="space-y-5 print:block">
              {/* Datos personales */}
              <div>
                <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">Datos del Candidato</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-muted/20 rounded-xl p-4 text-sm print:bg-white print:border print:border-black print:p-3">
                  {[
                    ['Teléfono',       candidate.phone],
                    ['Email',          candidate.email],
                    ['Ubicación',      candidate.location],
                    ['Edad',           candidate.age],
                    ['Estado civil',   candidate.marital_status],
                    ['Llamadas/día',   candidate.daily_calls],
                    ['Último ingreso', candidate.last_income ? `$${candidate.last_income.toLocaleString()}` : null],
                    ['Evaluación',     new Date(candidate.created_at).toLocaleString('es-MX')],
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

              {/* Resumen automático */}
              <div>
                <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">Resumen del Perfil</h4>
                <p className="text-muted-foreground text-sm bg-muted/10 rounded-xl p-4 leading-relaxed print:text-black print:bg-white print:border print:border-black print:p-3">
                  {summary}
                </p>
              </div>

              {/* Razón de salida */}
              {candidate.exit_reason && (
                <div>
                  <h4 className="text-foreground font-semibold mb-2 text-sm print:text-black">Razón de salida del último trabajo</h4>
                  <p className="text-muted-foreground text-sm bg-muted/20 rounded-xl p-3 leading-relaxed print:text-black print:bg-white print:border print:border-black">
                    {candidate.exit_reason}
                  </p>
                </div>
              )}

              {/* Highlight */}
              {candidate.highlight && (
                <div>
                  <h4 className="text-foreground font-semibold mb-2 text-sm print:text-black">Mejor Mensaje de Reactivación</h4>
                  <p className="text-muted-foreground text-sm bg-primary/5 border border-primary/20 rounded-xl p-3 leading-relaxed italic print:text-black print:bg-white print:border-black">
                    "{candidate.highlight}"
                  </p>
                </div>
              )}

              {/* CV */}
              <CVLinks candidate={candidate} />
            </div>
          )}

          {/* ── TAB: RESPUESTAS ── */}
          {activeTab === 'qa' && (
            <div className="space-y-3 print:block">
              <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider print:text-black">Preguntas y Respuestas</h4>
              {hasAnswers ? (
                Object.entries(candidate.answers!).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="bg-muted/10 rounded-xl p-4 print:border print:border-black print:rounded-none print:mb-2">
                      <p className="text-xs text-muted-foreground mb-1 print:text-black">{ANSWER_LABELS[key] || key}</p>
                      <p className="text-foreground text-sm leading-relaxed print:text-black">{value}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm bg-muted/10 rounded-xl p-4">
                  Esta evaluación no tiene respuestas detalladas guardadas.
                  Las respuestas completas se guardan a partir de hoy en evaluaciones nuevas.
                </p>
              )}
            </div>
          )}

          {/* ── TAB: EVALUACIÓN ── */}
          {activeTab === 'score' && (
            <div className="space-y-5 print:block">
              {/* Score breakdown */}
              <div>
                <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">Desglose de Score</h4>
                <div className="space-y-2.5 bg-muted/10 rounded-xl p-4 print:border print:border-black print:rounded-none">
                  {candidate.score_breakdown && Object.entries(candidate.score_breakdown).map(([key, val]) => (
                    <ScoreBar
                      key={key}
                      label={SCORE_LABELS[key] || key}
                      value={val as number}
                      max={SCORE_MAX[key] || 25}
                    />
                  ))}
                </div>
              </div>

              {/* Criterios de evaluación */}
              <div>
                <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">Criterios Aplicados</h4>
                <div className="space-y-2">
                  {candidate.score_breakdown && Object.entries(candidate.score_breakdown).map(([key, val]) => {
                    const criteria = SCORE_CRITERIA[key];
                    if (!criteria) return null;
                    const score = val as number;
                    const label = criteria[score] || criteria[String(score)] || `${score} pts`;
                    return (
                      <div key={key} className="flex items-start gap-3 text-sm bg-muted/10 rounded-lg p-3 print:border print:border-black print:rounded-none print:mb-1">
                        <span className="text-muted-foreground w-36 shrink-0 print:text-black">{SCORE_LABELS[key] || key}</span>
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

              {/* Flags */}
              {candidate.flags && Object.entries(candidate.flags).some(([, v]) => v) && (
                <div>
                  <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider print:text-black">Flags Detectados</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(candidate.flags).filter(([, v]) => v).map(([key]) => (
                      <span key={key} className="px-3 py-1 rounded-full bg-warning/15 text-warning text-xs border border-warning/30 print:text-black print:bg-white print:border-black">
                        {key.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descarte */}
              {candidate.disqualify_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 print:border-black print:bg-white">
                  <h4 className="text-destructive font-semibold mb-1 text-sm print:text-black">Razón de Descarte</h4>
                  <p className="text-destructive/80 text-sm print:text-black">{candidate.disqualify_reason.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: ENTREVISTA ── */}
          {activeTab === 'entrevista' && (
            <div className="space-y-5 print:block">
              <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider print:text-black">Gestión de Entrevista</h4>

              {/* Reclutador asignado */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block print:text-black">Reclutador asignado</label>
                <div className="relative print:hidden">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={e => handleAssignedToChange(e.target.value)}
                    placeholder="Nombre del reclutador..."
                    className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <p className="hidden print:block text-sm text-black border border-black p-3 rounded">
                  {assignedTo || 'Sin asignar'}
                </p>
              </div>

              {/* Estado de la entrevista */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block print:text-black">Estado de la entrevista</label>
                <div className="relative print:hidden">
                  <select
                    value={interviewStatus}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="w-full appearance-none bg-input border border-border rounded-xl px-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="">— Sin estado —</option>
                    {Object.entries(INTERVIEW_STATUS_CONFIG).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <p className="hidden print:block text-sm text-black">
                  {interviewStatus ? INTERVIEW_STATUS_CONFIG[interviewStatus]?.label : 'Sin estado'}
                </p>
              </div>

              {/* Fecha de entrevista */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block print:text-black">Fecha de entrevista</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={e => handleDateChange(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all print:hidden"
                />
                <p className="hidden print:block text-sm text-black">
                  {interviewDate
                    ? new Date(interviewDate).toLocaleString('es-MX')
                    : 'Sin fecha asignada'}
                </p>
              </div>

              {/* Notas del reclutador */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block print:text-black">Notas del reclutador</label>
                <textarea
                  value={recruiterNotes}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder="Observaciones post-entrevista, impresiones, próximos pasos..."
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

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`glass-card rounded-2xl p-8 max-w-sm w-full relative ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
      >
        <div className="flex justify-center mb-8"><MagnetLogo size="lg" /></div>
        <h2 className="text-foreground font-bold text-xl text-center mb-1">Panel de Administración</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">Acceso restringido · Magnetraffic</p>
        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Contraseña de acceso"
            autoFocus
            className={`w-full bg-input border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${
              error ? 'border-destructive focus:ring-destructive/50' : 'border-border focus:ring-primary/50'
            }`}
          />
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle size={12} /> Contraseña incorrecta
            </motion.p>
          )}
          <button
            onClick={handleSubmit}
            className="shimmer-btn w-full gold-gradient text-primary-foreground font-semibold py-3 rounded-full transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Acceder al Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(() =>
    sessionStorage.getItem('admin_auth') === 'true'
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [recruiterFilter, setRecruiterFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<AdminEvaluation | null>(null);

  const { evaluations, loading, error, refetch } = useAdmin(authenticated);

  const handleLogin = () => {
    sessionStorage.setItem('admin_auth', 'true');
    setAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setAuthenticated(false);
  };

  const handleModalUpdate = useCallback((updated: Partial<AdminEvaluation>) => {
    if (!selectedCandidate) return;
    setSelectedCandidate(prev => prev ? { ...prev, ...updated } : prev);
  }, [selectedCandidate]);

  // Lista de reclutadores únicos (normalizados)
  const recruiters = useMemo(() => {
    const set = new Set(
      evaluations
        .map(e => normalizeRecruiter(e.assigned_to))
        .filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [evaluations]);

  // Presets de rango de fechas
  const applyDatePreset = useCallback((preset: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const today = fmt(now);
      setDateFrom(today); setDateTo(today);
    } else if (preset === 'yesterday') {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      const yStr = fmt(y);
      setDateFrom(yStr); setDateTo(yStr);
    } else if (preset === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 6);
      setDateFrom(fmt(start)); setDateTo(fmt(now));
    } else if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(fmt(start)); setDateTo(fmt(now));
    }
  }, []);

  const filtered = useMemo(() => {
    return evaluations.filter(e => {
      const matchesSearch = !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.includes(search) ||
        (e.email || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus    = statusFilter === 'all' || e.status === statusFilter;
      const matchesRecruiter = recruiterFilter === 'all' || normalizeRecruiter(e.assigned_to) === recruiterFilter;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const evDate = new Date(e.created_at);
        evDate.setHours(0, 0, 0, 0);
        if (dateFrom) {
          const from = new Date(dateFrom + 'T00:00:00');
          if (evDate < from) matchesDate = false;
        }
        if (dateTo && matchesDate) {
          const to = new Date(dateTo + 'T23:59:59');
          if (evDate > to) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesRecruiter && matchesDate;
    });
  }, [evaluations, search, statusFilter, recruiterFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const completed   = evaluations.filter(e => e.status !== 'en_progreso');
    const today       = new Date().toDateString();
    const todayEvals  = evaluations.filter(e => new Date(e.created_at).toDateString() === today);
    const qualified   = evaluations.filter(e => e.status === 'elite' || e.status === 'calificado').length;
    const discarded   = evaluations.filter(e => e.status === 'descartado').length;
    const durations   = completed.filter(e => e.completed_at)
      .map(e => (new Date(e.completed_at!).getTime() - new Date(e.created_at).getTime()) / 60000);
    const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return {
      total:        evaluations.length,
      todayCount:   todayEvals.length,
      qualifiedPct: completed.length ? Math.round((qualified / completed.length) * 100) : 0,
      discardedPct: completed.length ? Math.round((discarded / completed.length) * 100) : 0,
      avgDuration:  Math.round(avgDuration),
    };
  }, [evaluations]);

  if (!authenticated) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md px-4 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <MagnetLogo size="sm" />
          <div className="flex items-center gap-3">
            <button onClick={refetch} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 print:hidden">

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} />
            <span>Error al cargar datos: {error}</span>
            <button onClick={refetch} className="ml-auto underline hover:no-underline">Reintentar</button>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total',          value: stats.total,        suffix: '',     colorClass: 'text-foreground'       },
            { label: 'Hoy',            value: stats.todayCount,   suffix: '',     colorClass: 'text-primary'          },
            { label: 'Calificados',    value: stats.qualifiedPct, suffix: '%',    colorClass: 'text-success'          },
            { label: 'Descartados',    value: stats.discardedPct, suffix: '%',    colorClass: 'text-destructive'      },
            { label: 'Duración prom.', value: stats.avgDuration,  suffix: ' min', colorClass: 'text-muted-foreground' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="spotlight-card glass-card rounded-xl p-4">
              <p className="text-muted-foreground text-xs mb-1.5">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.colorClass}`}>
                {loading
                  ? <span className="inline-block w-8 h-6 bg-muted/50 rounded animate-pulse" />
                  : <AnimatedCounter value={stat.value} suffix={stat.suffix} />}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Fila 1: búsqueda + estado + reclutador */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, teléfono o email..."
                className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-input border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                <option value="all">Todos los estados</option>
                <option value="elite">Elite</option>
                <option value="calificado">Calificado</option>
                <option value="potencial">Potencial</option>
                <option value="descartado">Descartado</option>
                <option value="en_progreso">En progreso</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {recruiters.length > 0 && (
              <div className="relative">
                <select value={recruiterFilter} onChange={e => setRecruiterFilter(e.target.value)}
                  className="appearance-none bg-input border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                  <option value="all">Todos los reclutadores</option>
                  {recruiters.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            )}
          </div>

          {/* Fila 2: filtro por fecha */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Presets rápidos */}
            {[
              { label: 'Hoy',         preset: 'today'     as const },
              { label: 'Ayer',        preset: 'yesterday' as const },
              { label: 'Esta semana', preset: 'week'      as const },
              { label: 'Este mes',    preset: 'month'     as const },
            ].map(({ label, preset }) => (
              <button key={preset} onClick={() => applyDatePreset(preset)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-input hover:border-primary/50 hover:text-primary text-muted-foreground transition-all">
                {label}
              </button>
            ))}

            <span className="text-muted-foreground/40 text-xs">|</span>

            {/* Desde */}
            <div className="relative flex items-center gap-1.5">
              <Calendar size={13} className="text-muted-foreground" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-input border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <span className="text-muted-foreground/40 text-xs">→</span>

            {/* Hasta */}
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-input border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />

            {/* Limpiar fechas */}
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-lg hover:bg-destructive/10">
                <X size={12} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Cargando evaluaciones...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    {['Nombre', 'Teléfono', 'Ubicación', 'Score', 'Resultado', 'Reclutador', 'Entrevista', 'Fecha', ''].map(h => (
                      <th key={h} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((ev, i) => {
                      const cfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.descartado;
                      const intCfg = ev.interview_status ? INTERVIEW_STATUS_CONFIG[ev.interview_status] : null;
                      return (
                        <motion.tr
                          key={ev.session_id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.4) }}
                          className="border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer group"
                          onClick={() => setSelectedCandidate(ev)}
                        >
                          <td className="px-4 py-3 text-foreground font-medium">{ev.name}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{ev.phone}</td>
                          <td className="px-4 py-3 text-muted-foreground">{ev.location || <span className="text-muted-foreground/40">—</span>}</td>
                          <td className="px-4 py-3">
                            <span className="text-foreground font-bold">{ev.score_total}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {normalizeRecruiter(ev.assigned_to) || <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {intCfg
                              ? <span className={`font-medium ${intCfg.color}`}>{intCfg.label}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            <div>{new Date(ev.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                            <div className="text-muted-foreground/50 text-[10px]">
                              {new Date(ev.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">Ver →</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search size={24} className="text-muted-foreground/40" />
                          <p>No hay evaluaciones que coincidan</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/40 pb-4">
          {filtered.length} de {evaluations.length} evaluaciones · Magnetraffic HR
        </p>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <DetailModal
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            onUpdate={handleModalUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

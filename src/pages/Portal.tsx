import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, LogOut, Search, X, AlertCircle, Copy, Check,
  ChevronDown, ExternalLink, User,
} from 'lucide-react';
import MagnetLogo from '@/components/MagnetLogo';
import { BriefingCard } from '@/components/admin/BriefingCard';
import { LLMResponseCard } from '@/components/admin/LLMResponseCard';
import RecruiterMetrics from '@/components/portal/RecruiterMetrics';
import { useBriefing, fetchEvaluationDetail, type AdminEvaluation } from '@/hooks/useAdmin';
import { ApiError as _ApiError } from '@/lib/api';
import {
  auth as apiAuth,
  evaluations as apiEvaluations,
  ApiError,
  type AdminUser,
  type EvaluationListItem,
} from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

// El backend incluye `label` en el JWT del recruiter. `AdminUser` puede traerlo
// en el payload — extendemos con campos opcionales.
interface RecruiterUser extends AdminUser {
  name?: string;
  label?: string;
  calendar_url?: string;
  weight?: number;
  total_assigned?: number;
}

interface RecruiterProfile {
  id: string;
  name: string;
  label: string;
  calendar_url: string;
  weight: number;
  total_assigned: number;
}

interface PortalSession {
  user: RecruiterUser;
}

interface PortalEvaluation {
  session_id: string;
  name: string;
  phone: string;
  location: string | null;
  score_total: number;
  status: 'en_progreso' | 'elite' | 'calificado' | 'potencial' | 'descartado';
  assigned_to: string | null;
  company: 'trebolife' | 'traduce' | null;
  interview_status: string | null;
  interview_date: string | null;
  hired_status: 'hired' | 'declined' | 'no_show' | null;
  hired_at: string | null;
  created_at: string;
  completed_at: string | null;
  email: string | null;
  recruiter_notes: string | null;
}

// ─── Constantes (mismas que Admin) ────────────────────────────────────────────

// STATUS_CONFIG labels are now driven by t() inside components — kept here only for className/dot
const STATUS_CONFIG_STYLE: Record<string, { className: string; dot: string; tKey: string }> = {
  elite:       { className: 'bg-primary/15 text-primary border-primary/40',             dot: 'bg-primary',          tKey: 'portal_status_elite'       },
  calificado:  { className: 'bg-success/15 text-success border-success/40',             dot: 'bg-success',          tKey: 'portal_status_calificado'  },
  potencial:   { className: 'bg-warning/15 text-warning border-warning/40',             dot: 'bg-warning',          tKey: 'portal_status_potencial'   },
  descartado:  { className: 'bg-destructive/15 text-destructive border-destructive/40', dot: 'bg-destructive',      tKey: 'portal_status_descartado'  },
  en_progreso: { className: 'bg-muted text-muted-foreground border-border',             dot: 'bg-muted-foreground', tKey: 'portal_status_en_progreso' },
};

const INTERVIEW_STATUS_CONFIG_STYLE: Record<string, { color: string; tKey: string }> = {
  agendada:                  { color: 'text-primary',     tKey: 'portal_interview_agendada'      },
  entrevistado:              { color: 'text-success',     tKey: 'portal_interview_entrevistado'  },
  no_asistio:                { color: 'text-destructive', tKey: 'portal_interview_no_asistio'    },
  reprogramado:              { color: 'text-warning',     tKey: 'portal_interview_reprogramado'  },
  rechazado_post_entrevista: { color: 'text-destructive', tKey: 'portal_interview_rechazado_post'},
};

// ─── Modal de detalle ─────────────────────────────────────────────────────────

/** Extended shape inside the portal modal that may carry Phase 3 fields. */
interface PortalEvaluationExt extends PortalEvaluation {
  briefing_summary?: string | null;
  briefing_questions?: string[] | null;
  briefing_flags?: { green: string[]; red: string[] } | null;
  answers?: Record<string, string> | null;
  score_breakdown?: Record<string, number> | null;
  highlight?: string | null;
}

function CandidateModal({ ev: evProp, onClose }: { ev: PortalEvaluation; onClose: () => void }) {
  const { t } = useLanguage();
  const cfg = STATUS_CONFIG_STYLE[evProp.status] || STATUS_CONFIG_STYLE.descartado;
  const intCfg = evProp.interview_status ? INTERVIEW_STATUS_CONFIG_STYLE[evProp.interview_status] : null;

  // Load full detail (Phase 3 fields)
  const [ev, setEv] = useState<PortalEvaluationExt>(evProp);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Use the id from the list item (may differ from session_id)
    const listEv = evProp as PortalEvaluation & { id?: string };
    const idToFetch = listEv.id ?? evProp.session_id;
    setDetailLoading(true);
    fetchEvaluationDetail(idToFetch)
      .then((full: AdminEvaluation) => {
        if (!cancelled) {
          setEv(prev => ({
            ...prev,
            briefing_summary:   (full as PortalEvaluationExt).briefing_summary,
            briefing_questions: (full as PortalEvaluationExt).briefing_questions,
            briefing_flags:     (full as PortalEvaluationExt).briefing_flags,
            answers:            full.answers as Record<string, string> | null,
            score_breakdown:    full.score_breakdown as Record<string, number> | null,
            highlight:          full.highlight,
          }));
        }
      })
      .catch(() => { /* tolerate — fallback to list data */ })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evProp.session_id]);

  // Briefing hook — recruiter can try to generate; 401 = hide button
  const [canGenerate, setCanGenerate] = useState(true);
  const {
    briefing,
    loading: briefingLoading,
    error: briefingError,
    generate: generateBriefingFn,
    setBriefing,
  } = useBriefing(
    (evProp as PortalEvaluation & { id?: string }).id ?? evProp.session_id,
    {
      summary:   ev.briefing_summary,
      questions: ev.briefing_questions,
      flags:     ev.briefing_flags,
    }
  );

  // Sync when full detail arrives
  useEffect(() => {
    if (ev.briefing_summary) {
      setBriefing({
        summary:   ev.briefing_summary!,
        questions: ev.briefing_questions ?? [],
        flags:     ev.briefing_flags ?? { green: [], red: [] },
      });
    }
  }, [ev.briefing_summary, ev.briefing_questions, ev.briefing_flags, setBriefing]);

  // Wrap generate to hide button on 401
  const handleGenerate = async () => {
    try {
      await generateBriefingFn();
    } catch (e) {
      if (e instanceof _ApiError && e.status === 401) {
        setCanGenerate(false);
      }
    }
  };

  // LLM fields
  const answers = ev.answers ?? null;
  const reactivationMsg    = answers?.reactivationMsg ?? answers?.highlight ?? ev.highlight ?? null;
  const reactivationReason = answers?.reactivationReasoning ?? null;
  const objectionResponse  = answers?.objectionResponse ?? null;
  const objectionReasoning = answers?.objectionReasoning ?? null;
  const autonomyDesc       = answers?.autonomyDesc ?? null;
  const autonomyReasoning  = answers?.autonomyReasoning ?? null;
  const sb = ev.score_breakdown ?? {};
  const reactivationScore  = (sb.E3_copywriting as number) ?? 0;
  const objectionScore     = (sb.E4_objeciones as number) ?? 0;
  const autonomyScore      = (sb.E5_autonomia as number) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="glass-card rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border/40">
          <div>
            <h3 className="text-foreground font-bold text-xl">{ev.name}</h3>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {t(cfg.tKey as Parameters<typeof t>[0])}
              </span>
              <span className="text-muted-foreground text-xs">
                Score: <strong className="text-foreground">{ev.score_total} pts</strong>
              </span>
              {intCfg && (
                <span className={`text-xs font-medium ${intCfg.color}`}>· {t(intCfg.tKey as Parameters<typeof t>[0])}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          {/* Loading indicator */}
          {detailLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
              {t('portal_modal_loading')}
            </div>
          )}

          {/* Basic data grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-muted/20 rounded-xl p-4 text-sm">
            {([
              [t('portal_modal_phone'),            ev.phone],
              [t('portal_modal_email'),             ev.email],
              [t('portal_modal_location'),          ev.location],
              [t('portal_modal_interview_status'),  intCfg ? t(intCfg.tKey as Parameters<typeof t>[0]) : null],
              [t('portal_modal_interview_date'),    ev.interview_date ? new Date(ev.interview_date).toLocaleString('es-MX') : null],
              [t('portal_modal_eval_date'),         new Date(ev.created_at).toLocaleString('es-MX')],
            ] as [string, string | null | undefined][]).map(([label, value]) => (
              <div key={label}>
                <span className="text-muted-foreground text-xs">{label}</span>
                <p className="text-foreground font-medium mt-0.5">
                  {value || <span className="text-muted-foreground/50 text-xs">—</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Briefing Card (concise, no hired buttons) */}
          <BriefingCard
            summary={briefing?.summary ?? null}
            questions={briefing?.questions ?? null}
            flags={briefing?.flags ?? null}
            generating={briefingLoading}
            error={briefingError}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
          />

          {/* LLM Responses */}
          {(reactivationMsg || objectionResponse || autonomyDesc) && (
            <div className="space-y-3">
              <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider">
                {t('portal_modal_llm_title')}
              </h4>
              <LLMResponseCard
                icon="📨"
                label="Reactivacion"
                score={reactivationScore}
                maxScore={20}
                response={reactivationMsg}
                reasoning={reactivationReason}
                highlight={ev.highlight ?? null}
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

          {ev.recruiter_notes && (
            <div>
              <h4 className="text-foreground font-semibold mb-2 text-sm">{t('portal_modal_notes_title')}</h4>
              <p className="text-muted-foreground text-sm bg-muted/10 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
                {ev.recruiter_notes}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Login screen ─────────────────────────────────────────────────────────────

function PortalLogin({ onLogin }: { onLogin: (session: PortalSession) => void }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(t('portal_login_error_empty'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuth.login(email, password);
      setLoading(false);
      onLogin({ user: res.user as RecruiterUser });
    } catch (e) {
      setLoading(false);
      const msg = e instanceof ApiError
        ? (e.status === 401 ? t('portal_login_error_credentials') : (e.message || t('portal_login_error_generic')))
        : t('portal_login_error_generic');
      setError(msg);
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
        className="glass-card rounded-2xl p-8 max-w-sm w-full relative"
      >
        <div className="flex justify-center mb-8"><MagnetLogo size="lg" /></div>
        <h2 className="text-foreground font-bold text-xl text-center mb-1">{t('portal_title')}</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">{t('portal_login_subtitle')}</p>
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={t('portal_login_email_placeholder')}
            autoFocus
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={t('portal_login_password_placeholder')}
            className={`w-full bg-input border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${
              error ? 'border-destructive focus:ring-destructive/50' : 'border-border focus:ring-primary/50'
            }`}
          />
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle size={12} />{error}
            </motion.p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="shimmer-btn w-full gold-gradient text-primary-foreground font-semibold py-3 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin" />
                {t('portal_login_btn_loading')}
              </span>
            ) : t('portal_login_btn')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Dashboard del reclutador ─────────────────────────────────────────────────

function PortalDashboard({ session, onLogout }: { session: PortalSession; onLogout: () => void }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [evaluations, setEvaluations] = useState<PortalEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEv, setSelectedEv] = useState<PortalEvaluation | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [copied, setCopied] = useState(false);

  // El label del reclutador viene en el JWT (campo opcional). Como fallback,
  // usamos el email — el backend filtra por assigned_to == label.
  const recruiterLabel = session.user.label ?? session.user.email;

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Construye el perfil con lo que tenemos del JWT.
      const builtProfile: RecruiterProfile = {
        id:             session.user.id,
        name:           session.user.name ?? session.user.email,
        label:          recruiterLabel,
        calendar_url:   session.user.calendar_url ?? '',
        weight:         session.user.weight ?? 0,
        total_assigned: session.user.total_assigned ?? 0,
      };
      setProfile(builtProfile);

      // Carga las evaluaciones asignadas a este recruiter.
      // El backend, si el JWT es de recruiter, fuerza el filtro por label.
      // Igualmente lo enviamos explícito para compatibilidad y para admins
      // que actúen como reclutadores.
      const res = await apiEvaluations.list({ assigned_to: recruiterLabel });
      const rows: PortalEvaluation[] = (res.rows ?? []).map((r: EvaluationListItem) => ({
        session_id:       r.session_id,
        name:             r.name,
        phone:            r.phone,
        location:         r.location,
        score_total:      r.score_total,
        status:           r.status,
        assigned_to:      r.assigned_to,
        company:          r.company,
        interview_status: r.interview_status,
        interview_date:   r.interview_date,
        hired_status:     r.hired_status,
        hired_at:         r.hired_at,
        created_at:       r.created_at,
        completed_at:     r.completed_at,
        email:            r.email,
        recruiter_notes:  null,
      }));
      setEvaluations(rows);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleLogout = async () => {
    await apiAuth.logout();
    onLogout();
  };

  const handleCopy = async () => {
    if (!profile?.calendar_url) return;
    await navigator.clipboard.writeText(profile.calendar_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = useMemo(() => {
    return evaluations.filter(e => {
      const matchesSearch = !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.includes(search);
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [evaluations, search, statusFilter]);

  const stats = useMemo(() => ({
    total:       evaluations.length,
    agendadas:   evaluations.filter(e => e.interview_status === 'agendada').length,
    elite:       evaluations.filter(e => e.status === 'elite').length,
    calificados: evaluations.filter(e => e.status === 'calificado').length,
    potenciales: evaluations.filter(e => e.status === 'potencial').length,
  }), [evaluations]);

  const recruiterName = profile?.name || session.user.email || t('portal_recruiter_fallback');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MagnetLogo size="sm" />
            <span className="text-muted-foreground/50 text-sm hidden sm:inline">|</span>
            <span className="text-muted-foreground text-sm hidden sm:inline">{t('portal_header_title')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User size={13} />{recruiterName}
            </span>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              {t('portal_btn_refresh')}
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
              <LogOut size={13} />{t('portal_btn_logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} />{error}
          </motion.div>
        )}

        {/* Stats / Metrics dashboard */}
        <RecruiterMetrics evaluations={evaluations} myLabel={recruiterLabel} />

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('portal_search_placeholder')}
              className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none bg-input border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
              <option value="all">{t('portal_filter_all')}</option>
              <option value="elite">{t('portal_filter_elite')}</option>
              <option value="calificado">{t('portal_filter_calificado')}</option>
              <option value="potencial">{t('portal_filter_potencial')}</option>
              <option value="descartado">{t('portal_filter_descartado')}</option>
              <option value="en_progreso">{t('portal_filter_en_progreso')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {search && (
            <button onClick={() => setSearch('')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-2.5 rounded-xl hover:bg-destructive/10 border border-border">
              <X size={12} />{t('portal_btn_clear')}
            </button>
          )}
        </div>

        {/* Totalizador */}
        {!loading && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground font-semibold">{filtered.length}</span>
            <span className="text-muted-foreground">
              {filtered.length !== evaluations.length ? `${t('portal_of_total', { total: String(evaluations.length) })} ` : ''}
              {filtered.length === 1 ? t('portal_candidate_singular') : t('portal_candidate_plural')}
            </span>
            {filtered.length !== evaluations.length && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {t('portal_filter_active')}
              </span>
            )}
          </div>
        )}

        {/* Tabla */}
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">{t('portal_loading_candidates')}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    {(
                      [
                        'portal_col_name',
                        'portal_col_phone',
                        'portal_col_location',
                        'portal_col_score',
                        'portal_col_result',
                        'portal_col_interview',
                        'portal_col_date',
                      ] as const
                    ).map(key => (
                      <th key={key} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wider">{t(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((ev, i) => {
                      const cfg = STATUS_CONFIG_STYLE[ev.status] || STATUS_CONFIG_STYLE.descartado;
                      const intCfg = ev.interview_status ? INTERVIEW_STATUS_CONFIG_STYLE[ev.interview_status] : null;
                      return (
                        <motion.tr
                          key={ev.session_id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.4) }}
                          className="border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer group"
                          onClick={() => setSelectedEv(ev)}
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
                              {t(cfg.tKey as Parameters<typeof t>[0])}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {intCfg
                              ? <span className={`font-medium ${intCfg.color}`}>{t(intCfg.tKey as Parameters<typeof t>[0])}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            <div>{new Date(ev.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                            <div className="text-muted-foreground/50 text-[10px]">
                              {new Date(ev.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search size={24} className="text-muted-foreground/40" />
                          <p>{t('portal_empty_candidates')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/40">
          {t('portal_footer', { filtered: String(filtered.length), total: String(evaluations.length) })}
        </p>

        {/* Mi Configuración */}
        {profile && (
          <div className="glass-card rounded-xl overflow-hidden">
            <button
              onClick={() => setShowConfig(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/20 transition-colors"
            >
              {t('portal_config_title')}
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showConfig ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {([
                        [t('portal_config_name'),           profile.name],
                        [t('portal_config_label'),          profile.label],
                        [t('portal_config_total_assigned'), String(profile.total_assigned)],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label}>
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <p className="text-foreground font-medium mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    {profile.calendar_url && (
                      <div>
                        <span className="text-muted-foreground text-xs">{t('portal_config_calendar_url')}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <a href={profile.calendar_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary text-xs hover:underline truncate max-w-xs">
                            <ExternalLink size={11} />{profile.calendar_url}
                          </a>
                          <button onClick={handleCopy}
                            className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary/50 hover:text-primary text-muted-foreground transition-all">
                            {copied ? <><Check size={12} className="text-success" />{t('portal_btn_copied')}</> : <><Copy size={12} />{t('portal_btn_copy_link')}</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </main>

      {/* Modal de detalle */}
      <AnimatePresence>
        {selectedEv && (
          <CandidateModal ev={selectedEv} onClose={() => setSelectedEv(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Portal() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!apiAuth.isAuthenticated()) {
      setChecking(false);
      return;
    }
    apiAuth.me()
      .then(res => { if (!cancelled) setSession({ user: res.user as RecruiterUser }); })
      .catch(() => { if (!cancelled) setSession(null); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <PortalLogin onLogin={setSession} />;
  }

  return <PortalDashboard session={session} onLogout={() => setSession(null)} />;
}

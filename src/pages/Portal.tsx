import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, LogOut, Search, X, AlertCircle, Copy, Check,
  ChevronDown, ExternalLink, User,
} from 'lucide-react';
import MagnetLogo from '@/components/MagnetLogo';
import RecruiterMetrics from '@/components/portal/RecruiterMetrics';
import CandidateDetailModal from '@/components/shared/CandidateDetailModal';
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
  id: string;
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
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState<string>(''); // YYYY-MM-DD
  const [customTo, setCustomTo] = useState<string>('');
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
        id:               r.id,
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

  // Date filter window
  const dateWindow = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => {
      const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
    };
    const endOfDay = (d: Date) => {
      const x = new Date(d); x.setHours(23, 59, 59, 999); return x;
    };
    if (dateFilter === 'all') return null;
    if (dateFilter === 'today') return { from: startOfDay(now), to: endOfDay(now) };
    if (dateFilter === 'yesterday') {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    if (dateFilter === 'week') {
      const start = new Date(now); start.setDate(start.getDate() - 6); // últimos 7 días
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    if (dateFilter === 'month') {
      const start = new Date(now); start.setDate(start.getDate() - 29); // últimos 30 días
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    if (dateFilter === 'custom' && customFrom && customTo) {
      return {
        from: startOfDay(new Date(`${customFrom}T00:00:00`)),
        to: endOfDay(new Date(`${customTo}T00:00:00`)),
      };
    }
    return null;
  }, [dateFilter, customFrom, customTo]);

  const filtered = useMemo(() => {
    return evaluations.filter(e => {
      const matchesSearch = !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.includes(search);
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesDate = !dateWindow || (() => {
        const t = new Date(e.created_at).getTime();
        return t >= dateWindow.from.getTime() && t <= dateWindow.to.getTime();
      })();
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [evaluations, search, statusFilter, dateWindow]);

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
        <div className="space-y-3">
          {/* Fila 1: búsqueda + estado */}
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

          {/* Fila 2: filtros de fecha (chips) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">{t('portal_filter_date_label')}</span>
            {([
              ['all',       t('portal_filter_date_all')],
              ['today',     t('portal_filter_date_today')],
              ['yesterday', t('portal_filter_date_yesterday')],
              ['week',      t('portal_filter_date_week')],
              ['month',     t('portal_filter_date_month')],
              ['custom',    t('portal_filter_date_custom')],
            ] as ['all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom', string][]).map(([key, label]) => (
              <button key={key} onClick={() => setDateFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  dateFilter === key
                    ? 'gold-gradient text-primary-foreground border-transparent'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                }`}>
                {label}
              </button>
            ))}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="bg-input border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-xs text-muted-foreground">→</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="bg-input border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>
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
          <CandidateDetailModal
            mode="recruiter"
            candidate={selectedEv}
            onClose={() => setSelectedEv(null)}
            onUpdate={(updated) => {
              setSelectedEv(prev => prev ? { ...prev, ...updated } as PortalEvaluation : prev);
              setEvaluations(prev => prev.map(e =>
                e.session_id === selectedEv.session_id
                  ? { ...e, ...updated } as PortalEvaluation
                  : e
              ));
            }}
          />
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

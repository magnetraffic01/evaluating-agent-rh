import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, LogOut, Search, X, AlertCircle, Copy, Check,
  ChevronDown, ExternalLink, User,
} from 'lucide-react';
import MagnetLogo from '@/components/MagnetLogo';
import { supabaseAuth } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RecruiterProfile {
  id: string;
  name: string;
  label: string;
  calendar_url: string;
  weight: number;
  total_assigned: number;
}

interface PortalEvaluation {
  session_id: string;
  name: string;
  phone: string;
  location: string | null;
  score_total: number;
  status: 'en_progreso' | 'elite' | 'calificado' | 'potencial' | 'descartado';
  assigned_to: string | null;
  interview_status: string | null;
  interview_date: string | null;
  created_at: string;
  completed_at: string | null;
  email: string | null;
  recruiter_notes: string | null;
}

// ─── Constantes (mismas que Admin) ────────────────────────────────────────────

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

// ─── Modal de detalle ─────────────────────────────────────────────────────────

function CandidateModal({ ev, onClose }: { ev: PortalEvaluation; onClose: () => void }) {
  const cfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.descartado;
  const intCfg = ev.interview_status ? INTERVIEW_STATUS_CONFIG[ev.interview_status] : null;

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
                {cfg.label}
              </span>
              <span className="text-muted-foreground text-xs">
                Score: <strong className="text-foreground">{ev.score_total} pts</strong>
              </span>
              {intCfg && (
                <span className={`text-xs font-medium ${intCfg.color}`}>· {intCfg.label}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-muted/20 rounded-xl p-4 text-sm">
            {([
              ['Teléfono',        ev.phone],
              ['Email',           ev.email],
              ['Ubicación',       ev.location],
              ['Estado entrevista', intCfg?.label],
              ['Fecha entrevista',  ev.interview_date ? new Date(ev.interview_date).toLocaleString('es-MX') : null],
              ['Fecha evaluación',  new Date(ev.created_at).toLocaleString('es-MX')],
            ] as [string, string | null | undefined][]).map(([label, value]) => (
              <div key={label}>
                <span className="text-muted-foreground text-xs">{label}</span>
                <p className="text-foreground font-medium mt-0.5">
                  {value || <span className="text-muted-foreground/50 text-xs">—</span>}
                </p>
              </div>
            ))}
          </div>

          {ev.recruiter_notes && (
            <div>
              <h4 className="text-foreground font-semibold mb-2 text-sm">Notas</h4>
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

function PortalLogin({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Por favor ingresa tu email y contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: authError } = await supabaseAuth.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    } else if (data.session) {
      onLogin(data.session);
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
        <h2 className="text-foreground font-bold text-xl text-center mb-1">Portal de Reclutador</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">Acceso restringido · Magnetraffic</p>
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="tu@email.com"
            autoFocus
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Contraseña"
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
                Accediendo...
              </span>
            ) : 'Acceder'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Dashboard del reclutador ─────────────────────────────────────────────────

function PortalDashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [evaluations, setEvaluations] = useState<PortalEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEv, setSelectedEv] = useState<PortalEvaluation | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [profileRes, evalsRes] = await Promise.all([
      supabaseAuth.from('recruiters').select('*').single(),
      supabaseAuth
        .from('evaluations')
        .select('session_id, name, phone, location, score_total, status, assigned_to, interview_status, interview_date, created_at, completed_at, email, recruiter_notes')
        .order('created_at', { ascending: false }),
    ]);

    if (profileRes.error) {
      setError('No se encontró perfil de reclutador asociado a esta cuenta.');
    } else {
      setProfile(profileRes.data as RecruiterProfile);
    }

    if (!evalsRes.error) {
      setEvaluations((evalsRes.data || []) as PortalEvaluation[]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    await supabaseAuth.auth.signOut();
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

  const recruiterName = profile?.name || session.user.email || 'Reclutador';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MagnetLogo size="sm" />
            <span className="text-muted-foreground/50 text-sm hidden sm:inline">|</span>
            <span className="text-muted-foreground text-sm hidden sm:inline">Portal Reclutador</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User size={13} />{recruiterName}
            </span>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
              <LogOut size={13} />Salir
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Mis Candidatos', value: stats.total,        colorClass: 'text-foreground'       },
            { label: 'Agendados',      value: stats.agendadas,    colorClass: 'text-primary'          },
            { label: 'Elite',          value: stats.elite,        colorClass: 'text-success'          },
            { label: 'Calificados',    value: stats.calificados,  colorClass: 'text-warning'          },
            { label: 'Potenciales',    value: stats.potenciales,  colorClass: 'text-muted-foreground' },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-xl p-4">
              <p className="text-muted-foreground text-xs mb-1.5">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.colorClass}`}>
                {loading
                  ? <span className="inline-block w-8 h-6 bg-muted/50 rounded animate-pulse" />
                  : stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
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
          {search && (
            <button onClick={() => setSearch('')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-2.5 rounded-xl hover:bg-destructive/10 border border-border">
              <X size={12} />Limpiar
            </button>
          )}
        </div>

        {/* Totalizador */}
        {!loading && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground font-semibold">{filtered.length}</span>
            <span className="text-muted-foreground">
              {filtered.length !== evaluations.length ? `de ${evaluations.length} ` : ''}
              {filtered.length === 1 ? 'candidato' : 'candidatos'}
            </span>
            {filtered.length !== evaluations.length && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                filtro activo
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
                <p className="text-muted-foreground text-sm">Cargando candidatos...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    {['Nombre', 'Teléfono', 'Ubicación', 'Score', 'Resultado', 'Entrevista', 'Fecha'].map(h => (
                      <th key={h} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wider">{h}</th>
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
                              {cfg.label}
                            </span>
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
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search size={24} className="text-muted-foreground/40" />
                          <p>No hay candidatos que coincidan</p>
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
          {filtered.length} de {evaluations.length} candidatos · Magnetraffic HR
        </p>

        {/* Mi Configuración */}
        {profile && (
          <div className="glass-card rounded-xl overflow-hidden">
            <button
              onClick={() => setShowConfig(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/20 transition-colors"
            >
              Mi Configuración
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
                        ['Nombre',   profile.name],
                        ['Label',    profile.label],
                        ['Asignados totales', String(profile.total_assigned)],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label}>
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <p className="text-foreground font-medium mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">URL del calendario</span>
                      <div className="flex items-center gap-2 mt-1">
                        <a href={profile.calendar_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary text-xs hover:underline truncate max-w-xs">
                          <ExternalLink size={11} />{profile.calendar_url}
                        </a>
                        <button onClick={handleCopy}
                          className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary/50 hover:text-primary text-muted-foreground transition-all">
                          {copied ? <><Check size={12} className="text-success" />Copiado</> : <><Copy size={12} />Copiar enlace</>}
                        </button>
                      </div>
                    </div>
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
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
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

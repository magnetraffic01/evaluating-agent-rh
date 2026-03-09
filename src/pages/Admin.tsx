import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, RefreshCw, ChevronDown, ExternalLink, AlertCircle } from 'lucide-react';
import MagnetLogo from '@/components/MagnetLogo';
import { useAdmin, AdminEvaluation } from '@/hooks/useAdmin';
import { supabaseAdmin } from '@/lib/supabase';

// ─── Constantes ────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Info2026$';

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  elite:      { label: 'ELITE',      className: 'bg-primary/15 text-primary border-primary/40',     dot: 'bg-primary'     },
  calificado: { label: 'CALIFICADO', className: 'bg-success/15 text-success border-success/40',     dot: 'bg-success'     },
  potencial:  { label: 'POTENCIAL',  className: 'bg-warning/15 text-warning border-warning/40',     dot: 'bg-warning'     },
  descartado: { label: 'DESCARTADO', className: 'bg-destructive/15 text-destructive border-destructive/40', dot: 'bg-destructive' },
  en_progreso:{ label: 'EN PROGRESO',className: 'bg-muted text-muted-foreground border-border',     dot: 'bg-muted-foreground' },
};

const SCORE_LABELS: Record<string, string> = {
  E1_cierre:      'Cierre directo',
  E1_volumen:     'Volumen llamadas',
  E3_copywriting: 'Copywriting',
  E4_objeciones:  'Objeciones',
  E5_autonomia:   'Autonomía',
  E6_filosofia:   'Filosofía',
  C1_estabilidad: 'Estabilidad',
  V1_penalty:     'Penalización V1',
  E2_penalty:     'Penalización E2',
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
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

// ─── CV Links — genera URL firmada si es un path de Storage ──────────────────

function CVLinks({ candidate }: { candidate: AdminEvaluation }) {
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isStoragePath = (url: string) =>
    url && !url.startsWith('http') && url.includes('/');

  useEffect(() => {
    const raw = candidate.cv_url;
    if (!raw) return;
    if (isStoragePath(raw)) {
      setLoading(true);
      supabaseAdmin.storage
        .from('cvs')
        .createSignedUrl(raw, 60 * 60) // 1 hora
        .then(({ data }) => {
          if (data?.signedUrl) setCvUrl(data.signedUrl);
        })
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
          <a
            href={candidate.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <ExternalLink size={13} />
            {candidate.linkedin_url}
          </a>
        )}
        {candidate.cv_url && (
          loading ? (
            <span className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
              Generando enlace...
            </span>
          ) : cvUrl ? (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline text-sm"
            >
              <ExternalLink size={13} />
              Ver CV del candidato
            </a>
          ) : null
        )}
      </div>
    </div>
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
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`glass-card rounded-2xl p-8 max-w-sm w-full relative ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
      >
        <div className="flex justify-center mb-8">
          <MagnetLogo size="lg" />
        </div>

        <h2 className="text-foreground font-bold text-xl text-center mb-1">Panel de Administración</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">Acceso restringido · Magnetraffic</p>

        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Contraseña de acceso"
            autoFocus
            className={`w-full bg-input border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${
              error ? 'border-destructive focus:ring-destructive/50' : 'border-border focus:ring-primary/50'
            }`}
          />
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-destructive text-xs flex items-center gap-1">
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

  const filtered = useMemo(() => {
    return evaluations.filter((e) => {
      const matchesSearch = !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.includes(search) ||
        (e.email || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [evaluations, search, statusFilter]);

  const stats = useMemo(() => {
    const completed = evaluations.filter(e => e.status !== 'en_progreso');
    const today = new Date().toDateString();
    const todayEvals = evaluations.filter(e => new Date(e.created_at).toDateString() === today);
    const qualified = evaluations.filter(e => e.status === 'elite' || e.status === 'calificado').length;
    const discarded = evaluations.filter(e => e.status === 'descartado').length;
    const durations = completed
      .filter(e => e.completed_at)
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
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <MagnetLogo size="sm" />
          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Error state */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle size={16} />
            <span>Error al cargar datos: {error}</span>
            <button onClick={refetch} className="ml-auto underline hover:no-underline">Reintentar</button>
          </motion.div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total',           value: stats.total,        suffix: '',   colorClass: 'text-foreground'    },
            { label: 'Hoy',             value: stats.todayCount,   suffix: '',   colorClass: 'text-primary'       },
            { label: 'Calificados',     value: stats.qualifiedPct, suffix: '%',  colorClass: 'text-success'       },
            { label: 'Descartados',     value: stats.discardedPct, suffix: '%',  colorClass: 'text-destructive'   },
            { label: 'Duración prom.',  value: stats.avgDuration,  suffix: ' min', colorClass: 'text-muted-foreground' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="spotlight-card glass-card rounded-xl p-4"
            >
              <p className="text-muted-foreground text-xs mb-1.5">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.colorClass}`}>
                {loading
                  ? <span className="inline-block w-8 h-6 bg-muted/50 rounded animate-pulse" />
                  : <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                }
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-input border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="all">Todos los estados</option>
              <option value="elite">Elite</option>
              <option value="calificado">Calificado</option>
              <option value="potencial">Potencial</option>
              <option value="descartado">Descartado</option>
              <option value="en_progreso">En progreso</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
                    {['Nombre', 'Teléfono', 'Email', 'Ubicación', 'Score', 'Resultado', 'Fecha', 'Duración', ''].map((h) => (
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
                      const duration = ev.completed_at
                        ? Math.round((new Date(ev.completed_at).getTime() - new Date(ev.created_at).getTime()) / 60000)
                        : null;
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
                          <td className="px-4 py-3 text-muted-foreground">{ev.email || <span className="text-muted-foreground/40">—</span>}</td>
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
                            {new Date(ev.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {duration !== null ? `${duration} min` : <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Ver →
                            </span>
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.95, y: 16  }}
              transition={{ duration: 0.25 }}
              className="glass-card rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-foreground font-bold text-xl">{selectedCandidate.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedCandidate.status] || STATUS_CONFIG.descartado;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      );
                    })()}
                    <span className="text-muted-foreground text-xs">
                      Score: <strong className="text-foreground">{selectedCandidate.score_total} pts</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Datos del candidato */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6 text-sm bg-muted/20 rounded-xl p-4">
                {[
                  ['Teléfono',     selectedCandidate.phone],
                  ['Email',        selectedCandidate.email],
                  ['Ubicación',    selectedCandidate.location],
                  ['Edad',         selectedCandidate.age],
                  ['Estado civil', selectedCandidate.marital_status],
                  ['Llamadas/día', selectedCandidate.daily_calls],
                  ['Último ingreso', selectedCandidate.last_income ? `$${selectedCandidate.last_income.toLocaleString()}` : null],
                  ['Fecha inicio', new Date(selectedCandidate.created_at).toLocaleString('es-MX')],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <p className="text-foreground font-medium mt-0.5">{value || <span className="text-muted-foreground/50 text-xs">—</span>}</p>
                  </div>
                ))}
              </div>

              {/* Score breakdown */}
              <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider">Desglose de Score</h4>
              <div className="space-y-2.5 mb-6 bg-muted/10 rounded-xl p-4">
                {selectedCandidate.score_breakdown && Object.entries(selectedCandidate.score_breakdown).map(([key, val]) => (
                  <ScoreBar
                    key={key}
                    label={SCORE_LABELS[key] || key}
                    value={val as number}
                    max={key.includes('penalty') ? 10 : 25}
                  />
                ))}
              </div>

              {/* Flags */}
              {selectedCandidate.flags && Object.entries(selectedCandidate.flags).some(([, v]) => v) && (
                <div className="mb-6">
                  <h4 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider">Flags Detectados</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedCandidate.flags).filter(([, v]) => v).map(([key]) => (
                      <span key={key} className="px-3 py-1 rounded-full bg-warning/15 text-warning text-xs border border-warning/30">
                        {key.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descarte */}
              {selectedCandidate.disqualify_reason && (
                <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                  <h4 className="text-destructive font-semibold mb-1 text-sm">Razón de Descarte</h4>
                  <p className="text-destructive/80 text-sm">{selectedCandidate.disqualify_reason.replace(/_/g, ' ')}</p>
                </div>
              )}

              {/* Razón de salida */}
              {selectedCandidate.exit_reason && (
                <div className="mb-6">
                  <h4 className="text-foreground font-semibold mb-2 text-sm">Razón de salida del último trabajo</h4>
                  <p className="text-muted-foreground text-sm bg-muted/20 rounded-xl p-3 leading-relaxed">
                    {selectedCandidate.exit_reason}
                  </p>
                </div>
              )}

              {/* Highlight */}
              {selectedCandidate.highlight && (
                <div className="mb-6">
                  <h4 className="text-foreground font-semibold mb-2 text-sm">Mejor Mensaje de Reactivación</h4>
                  <p className="text-muted-foreground text-sm bg-primary/5 border border-primary/20 rounded-xl p-3 leading-relaxed italic">
                    "{selectedCandidate.highlight}"
                  </p>
                </div>
              )}

              {/* CV / LinkedIn */}
              <CVLinks candidate={selectedCandidate} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

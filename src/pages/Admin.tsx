import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, RefreshCw, ChevronDown, AlertCircle, Calendar, TrendingUp, Trophy, Download } from 'lucide-react';
import MagnetLogo from '@/components/MagnetLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin, AdminEvaluation } from '@/hooks/useAdmin';
import { AnalyticsPanel } from '@/components/admin/AnalyticsPanel';
import { CompaniesPanel } from '@/components/admin/CompaniesPanel';
import { RecruitersWithCompanies } from '@/components/admin/RecruitersWithCompanies';
import { PerformancePanel } from '@/components/admin/PerformancePanel';
import CandidateDetailModal from '@/components/shared/CandidateDetailModal';
import { toast } from 'sonner';
import {
  auth as apiAuth,
  recruiters as apiRecruiters,
  ApiError,
  type AdminUser,
  type Recruiter as ApiRecruiter,
} from '@/lib/api';

// Sesión admin (forma minimal — reemplaza al `Session` de Supabase).
interface AdminSession {
  user: AdminUser;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

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

// Normaliza IDs de GHL a etiquetas legibles (usada en la tabla del listado).
function normalizeRecruiter(value: string | null | undefined): string | null {
  if (!value) return null;
  const map: Record<string, string> = {
    'y9etbqml6yxo6z3as8xw': 'Reclutador 1',
    'blcv7ez4gifnduyк1vry':  'Reclutador 2',
  };
  return map[value.toLowerCase()] ?? value;
}

// ─── CSV export helpers ──────────────────────────────────────────────────────

function csvEscape(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportCandidatesCsv(rows: AdminEvaluation[]): void {
  const headers = [
    'id', 'created_at', 'name', 'phone', 'email', 'location',
    'score', 'status', 'assigned_to', 'company',
    'interview_status', 'interview_date', 'hired_status',
  ];
  const lines: string[] = [headers.join(',')];
  for (const r of rows) {
    const rec = r as AdminEvaluation & {
      company?: string | null;
      hired_status?: string | null;
    };
    lines.push([
      csvEscape(r.id),
      csvEscape(r.created_at),
      csvEscape(r.name),
      csvEscape(r.phone),
      csvEscape(r.email),
      csvEscape(r.location),
      csvEscape(r.score_total),
      csvEscape(r.status),
      csvEscape(r.assigned_to),
      csvEscape(rec.company ?? ''),
      csvEscape(r.interview_status),
      csvEscape(r.interview_date),
      csvEscape(rec.hired_status ?? ''),
    ].join(','));
  }
  const csv = lines.join('\r\n');
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const filename = `candidatos_${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.csv`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── RecruiterPanel ───────────────────────────────────────────────────────────

type Recruiter = ApiRecruiter & { active: boolean };

function toBool(v: boolean | number | undefined | null): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number')  return v === 1;
  return false;
}

function RecruiterPanel() {
  const { t } = useLanguage();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Recruiter>>({});
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecruiter, setNewRecruiter] = useState({ name: '', label: '', calendar_url: '', weight: 0 });
  const [addError, setAddError] = useState<string | null>(null);

  const fetchRecruiters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRecruiters.list();
      const rows = (res.rows ?? [])
        .map(r => ({ ...r, active: toBool(r.active) }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setRecruiters(rows);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecruiters(); }, []);

  const totalAssigned = recruiters.reduce((s, r) => s + (r.total_assigned || 0), 0);
  const activeWeightSum = recruiters.filter(r => r.active).reduce((s, r) => s + (r.weight || 0), 0);

  const startEdit = (r: Recruiter) => {
    setEditingId(r.id);
    setEditDraft({ name: r.name, calendar_url: r.calendar_url, weight: r.weight });
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft({}); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await apiRecruiters.update(id, {
        name:         editDraft.name,
        calendar_url: editDraft.calendar_url,
        weight:       editDraft.weight,
      });
      setRecruiters(prev => prev.map(r => r.id === id ? { ...r, ...editDraft } as Recruiter : r));
      setEditingId(null);
      setEditDraft({});
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: Recruiter) => {
    try {
      await apiRecruiters.update(r.id, { active: !r.active });
      setRecruiters(prev => prev.map(x => x.id === r.id ? { ...x, active: !x.active } : x));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e)));
    }
  };

  const updateMonthlyGoal = async (r: Recruiter, raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 1000) return;
    if (n === (r.monthly_goal ?? 6)) return;
    // Optimistic update
    setRecruiters(prev => prev.map(x => x.id === r.id ? { ...x, monthly_goal: n } : x));
    try {
      await apiRecruiters.update(r.id, { monthly_goal: n });
      toast.success(t('admin_recruiter_goal_updated', { name: r.name }));
    } catch (e) {
      // Revert on error
      setRecruiters(prev => prev.map(x => x.id === r.id ? { ...x, monthly_goal: r.monthly_goal } : x));
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      toast.error(msg);
    }
  };

  const handleAdd = async () => {
    setAddError(null);
    if (!newRecruiter.name || !newRecruiter.label || !newRecruiter.calendar_url) {
      setAddError(t('admin_recruiter_add_error_required'));
      return;
    }
    try {
      await apiRecruiters.create({
        name:         newRecruiter.name,
        label:        newRecruiter.label,
        calendar_url: newRecruiter.calendar_url,
        weight:       newRecruiter.weight,
        active:       false,
      });
      setShowAddForm(false);
      setNewRecruiter({ name: '', label: '', calendar_url: '', weight: 0 });
      fetchRecruiters();
    } catch (e) {
      setAddError(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* Resumen de pesos */}
      <div className="glass-card rounded-xl p-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('admin_recruiter_weights_label')}</span>
        <span className={`font-bold ${activeWeightSum > 100 ? 'text-destructive' : 'text-primary'}`}>
          {activeWeightSum} / 100
          {activeWeightSum > 100 && <span className="ml-2 text-xs text-destructive">{t('admin_recruiter_weights_over')}</span>}
        </span>
      </div>

      {/* Tabla de reclutadores */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                {[
                  t('admin_recruiter_col_name'),
                  t('admin_recruiter_col_label'),
                  t('admin_recruiter_col_calendar'),
                  t('admin_recruiter_col_weight'),
                  t('admin_recruiter_col_total'),
                  t('admin_recruiter_col_real_pct'),
                  t('admin_recruiter_goal_label'),
                  t('admin_recruiter_col_status'),
                  t('admin_recruiter_col_distribution'),
                  t('admin_recruiter_col_actions'),
                ].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recruiters.map(r => {
                const realPct = totalAssigned > 0 ? Math.round((r.total_assigned / totalAssigned) * 100) : 0;
                const barWidth = totalAssigned > 0 ? (r.total_assigned / totalAssigned) * 100 : 0;
                const isEditing = editingId === r.id;
                return (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3">
                      {isEditing
                        ? <input value={editDraft.name || ''} onChange={e => setEditDraft(p => ({ ...p, name: e.target.value }))}
                            className="w-full bg-input border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        : <span className="text-foreground font-medium">{r.name}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.label}</td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {isEditing
                        ? <input value={editDraft.calendar_url || ''} onChange={e => setEditDraft(p => ({ ...p, calendar_url: e.target.value }))}
                            className="w-full bg-input border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        : <span className="text-muted-foreground text-xs truncate block max-w-[180px]" title={r.calendar_url}>
                            {r.calendar_url ? r.calendar_url.replace(/^https?:\/\//, '').slice(0, 30) + (r.calendar_url.length > 35 ? '…' : '') : '—'}
                          </span>}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing
                        ? <input type="number" min={0} max={100} value={editDraft.weight ?? 0} onChange={e => setEditDraft(p => ({ ...p, weight: Number(e.target.value) }))}
                            className="w-16 bg-input border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        : <span className="text-foreground">{r.weight}%</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.total_assigned}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${realPct > (r.weight || 0) ? 'text-warning' : 'text-success'}`}>{realPct}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        defaultValue={r.monthly_goal ?? 6}
                        onBlur={(e) => updateMonthlyGoal(r, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="w-16 bg-input border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(r)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          r.active
                            ? 'bg-success/15 text-success border-success/40 hover:bg-success/25'
                            : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                        }`}>
                        {r.active ? t('admin_recruiter_active') : t('admin_recruiter_inactive')}
                      </button>
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      {/* Barra de distribución */}
                      <div className="relative h-3 bg-muted/40 rounded-full overflow-hidden w-full">
                        <div
                          className="h-full bg-primary/40 rounded-full transition-all"
                          style={{ width: `${Math.min(barWidth, 100)}%` }}
                        />
                        {/* Marca de cuota esperada */}
                        {r.weight > 0 && (
                          <div
                            className="absolute top-0 h-full w-0.5 bg-primary"
                            style={{ left: `${Math.min(r.weight, 100)}%` }}
                            title={`Cuota: ${r.weight}%`}
                          />
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{realPct}% real · {r.weight}% cuota</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => saveEdit(r.id)} disabled={saving}
                            className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-all disabled:opacity-50">
                            {saving ? '...' : t('admin_recruiter_btn_save')}
                          </button>
                          <button onClick={cancelEdit}
                            className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/70 transition-all">
                            {t('admin_recruiter_btn_cancel')}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(r)}
                          className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs hover:border-primary/50 hover:text-primary border border-border transition-all">
                          {t('admin_recruiter_btn_edit')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recruiters.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    {t('admin_recruiter_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón agregar */}
      <div>
        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)}
            className="shimmer-btn gold-gradient text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-[0.98]">
            {t('admin_recruiter_btn_add')}
          </button>
        ) : (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h4 className="text-foreground font-semibold text-sm">{t('admin_recruiter_add_title')}</h4>
            {addError && (
              <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle size={12} />{addError}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('admin_recruiter_field_name_label')}</label>
                <input value={newRecruiter.name} onChange={e => setNewRecruiter(p => ({ ...p, name: e.target.value }))}
                  placeholder={t('admin_recruiter_field_name_placeholder')}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('admin_recruiter_field_label_label')}</label>
                <input value={newRecruiter.label} onChange={e => setNewRecruiter(p => ({ ...p, label: e.target.value }))}
                  placeholder={t('admin_recruiter_field_label_placeholder')}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">{t('admin_recruiter_field_calendar_label')}</label>
                <input value={newRecruiter.calendar_url} onChange={e => setNewRecruiter(p => ({ ...p, calendar_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('admin_recruiter_field_weight_label')}</label>
                <input type="number" min={0} max={100} value={newRecruiter.weight} onChange={e => setNewRecruiter(p => ({ ...p, weight: Number(e.target.value) }))}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd}
                className="shimmer-btn gold-gradient text-primary-foreground font-semibold px-5 py-2 rounded-full text-sm transition-all hover:opacity-90">
                {t('admin_recruiter_btn_save')}
              </button>
              <button onClick={() => { setShowAddForm(false); setAddError(null); }}
                className="px-5 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground border border-border hover:border-border/70 transition-all">
                {t('admin_recruiter_btn_cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Login (backend Express + JWT) ────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(t('admin_login_error_empty'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuth.login(email, password);
      setLoading(false);
      onLogin({ user: res.user });
    } catch (e) {
      setLoading(false);
      const msg = e instanceof ApiError
        ? (e.status === 401 ? t('admin_login_error_credentials') : (e.message || t('admin_login_error_generic')))
        : t('admin_login_error_generic');
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
        <h2 className="text-foreground font-bold text-xl text-center mb-1">{t('admin_login_title')}</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">{t('admin_login_subtitle')}</p>
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={t('admin_login_email_placeholder')}
            autoFocus
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={t('admin_login_password_placeholder')}
            className={`w-full bg-input border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${
              error ? 'border-destructive focus:ring-destructive/50' : 'border-border focus:ring-primary/50'
            }`}
          />
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle size={12} /> {error}
            </motion.p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="shimmer-btn w-full gold-gradient text-primary-foreground font-semibold py-3 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? t('admin_login_btn_loading') : t('admin_login_btn')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Admin() {
  const { t } = useLanguage();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'candidatos' | 'reclutadores' | 'empresas' | 'performance' | 'analytics'>('candidatos');
  const analyticsRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [recruiterFilter, setRecruiterFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<AdminEvaluation | null>(null);

  // Verificar sesión existente al montar (token persistido en localStorage)
  useEffect(() => {
    let cancelled = false;
    if (!apiAuth.isAuthenticated()) {
      setCheckingSession(false);
      return;
    }
    apiAuth.me()
      .then(res => { if (!cancelled) setSession({ user: res.user }); })
      .catch(() => { if (!cancelled) setSession(null); })
      .finally(() => { if (!cancelled) setCheckingSession(false); });
    return () => { cancelled = true; };
  }, []);

  const { evaluations, loading, error, refetch } = useAdmin(!!session);

  const handleLogin = (s: AdminSession) => setSession(s);

  const handleLogout = async () => {
    await apiAuth.logout();
    setSession(null);
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

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return <LoginScreen onLogin={handleLogin} />;

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
              {t('admin_btn_refresh')}
            </button>
            <button onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
              {t('admin_btn_logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 print:hidden">

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-border pb-0">
          {([
            ['candidatos',  t('admin_tab_candidates'), null],
            ['reclutadores',t('admin_tab_recruiters'), null],
            ['empresas',    t('admin_tab_companies'),  null],
            ['performance', t('admin_tab_performance'),<Trophy size={14} key="p" />],
            ['analytics',   t('admin_tab_analytics'),  <TrendingUp size={14} key="a" />],
          ] as [string, string, React.ReactNode][]).map(([tab, label, icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab as 'candidatos' | 'reclutadores' | 'empresas' | 'performance' | 'analytics')}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {icon}{label}
            </button>
          ))}
        </div>

        {activeTab === 'reclutadores' && (
          <div className="space-y-8">
            <RecruiterPanel />
            <div>
              <h2 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-4 border-t border-border/60 pt-6">
                {t('admin_company_assignment_title')}
              </h2>
              <RecruitersWithCompanies />
            </div>
          </div>
        )}

        {activeTab === 'empresas' && (
          <CompaniesPanel />
        )}

        {activeTab === 'performance' && (
          <PerformancePanel
            onJumpToAbandoned={() => {
              setActiveTab('analytics');
              // Scroll after the analytics panel mounts
              setTimeout(() => {
                const el = document.getElementById('admin-abandoned-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 200);
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <div ref={analyticsRef}>
            <AnalyticsPanel />
          </div>
        )}

        {activeTab === 'candidatos' && (<>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} />
            <span>{t('admin_error_loading', { error: error ?? '' })}</span>
            <button onClick={refetch} className="ml-auto underline hover:no-underline">{t('admin_btn_retry')}</button>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: t('admin_stat_total'),        value: stats.total,        suffix: '',     colorClass: 'text-foreground'       },
            { label: t('admin_stat_today'),        value: stats.todayCount,   suffix: '',     colorClass: 'text-primary'          },
            { label: t('admin_stat_qualified'),    value: stats.qualifiedPct, suffix: '%',    colorClass: 'text-success'          },
            { label: t('admin_stat_discarded'),    value: stats.discardedPct, suffix: '%',    colorClass: 'text-destructive'      },
            { label: t('admin_stat_avg_duration'), value: stats.avgDuration,  suffix: ' min', colorClass: 'text-muted-foreground' },
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
                placeholder={t('admin_search_placeholder')}
                className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-input border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                <option value="all">{t('admin_filter_all_statuses')}</option>
                <option value="elite">{t('admin_filter_elite')}</option>
                <option value="calificado">{t('admin_filter_calificado')}</option>
                <option value="potencial">{t('admin_filter_potencial')}</option>
                <option value="descartado">{t('admin_filter_descartado')}</option>
                <option value="en_progreso">{t('admin_filter_en_progreso')}</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {recruiters.length > 0 && (
              <div className="relative">
                <select value={recruiterFilter} onChange={e => setRecruiterFilter(e.target.value)}
                  className="appearance-none bg-input border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                  <option value="all">{t('admin_filter_all_recruiters')}</option>
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
              { label: t('admin_filter_today'),      preset: 'today'     as const },
              { label: t('admin_filter_yesterday'),  preset: 'yesterday' as const },
              { label: t('admin_filter_this_week'),  preset: 'week'      as const },
              { label: t('admin_filter_this_month'), preset: 'month'     as const },
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
                {t('admin_btn_clear_dates')}
              </button>
            )}
          </div>
        </div>

        {/* Totalizador + Export CSV */}
        {!loading && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-foreground font-semibold">{filtered.length}</span>
            <span className="text-muted-foreground">
              {filtered.length !== evaluations.length ? `${t('admin_count_of', { total: evaluations.length })} ` : ''}
              {filtered.length === 1 ? t('admin_count_evaluation_singular') : t('admin_count_evaluation_plural')}
            </span>
            {filtered.length !== evaluations.length && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {t('admin_filter_active')}
              </span>
            )}
            <button
              onClick={() => exportCandidatesCsv(filtered)}
              disabled={filtered.length === 0}
              className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-input hover:border-primary/50 hover:text-primary text-muted-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              {t('admin_export_csv')}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">{t('admin_loading_evaluations')}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    {[t('admin_col_name'), t('admin_col_phone'), t('admin_col_location'), t('admin_col_score'), t('admin_col_result'), t('admin_col_recruiter'), t('admin_col_interview'), t('admin_col_date'), ''].map(h => (
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
                              {t(cfg.labelKey)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {normalizeRecruiter(ev.assigned_to) || <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {intCfg
                              ? <span className={`font-medium ${intCfg.color}`}>{t(intCfg.labelKey)}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            <div>{new Date(ev.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                            <div className="text-muted-foreground/50 text-[10px]">
                              {new Date(ev.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">{t('admin_btn_view')}</span>
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
                          <p>{t('admin_empty_evaluations')}</p>
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
          {t('admin_footer', { filtered: filtered.length, total: evaluations.length })}
        </p>

        </>)}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <CandidateDetailModal
            mode="admin"
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            onUpdate={handleModalUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

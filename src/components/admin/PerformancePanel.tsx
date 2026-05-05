// src/components/admin/PerformancePanel.tsx
// Performance / leaderboard panel for the admin tab "Rendimiento".
// Combines gamification leaderboard (server-side) with per-recruiter stats
// computed client-side from the evaluations list (since team-stats has no
// impersonation support).

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Trophy, TrendingUp, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  recruiters as apiRecruiters,
  recruiterAnalytics,
  evaluations as apiEvaluations,
  ApiError,
  type RecruiterFull,
  type LeaderboardEntry,
  type EvaluationListItem,
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecruiterStats {
  id: string;
  name: string;
  label: string;
  monthly_goal: number;
  hires_mes: number;
  scheduled: number;
  hired: number;
  total: number;
  hire_rate: number;
  avg_assign_to_schedule_h: number | null;
  avg_schedule_to_hire_h: number | null;
  by_status: { elite: number; calificado: number; potencial: number; descartado: number };
  companies: string[];
  active: boolean;
  streak: number;
}

type SortKey = 'name' | 'companies' | 'hires_mes' | 'monthly_goal' | 'hire_rate'
  | 'avg_assign_to_schedule_h' | 'avg_schedule_to_hire_h' | 'streak';

interface Props {
  onJumpToAbandoned?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBool(v: boolean | number | undefined | null): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  return false;
}

function formatHoursOrDays(h: number | null): string {
  if (h == null || !isFinite(h)) return '—';
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// Compute consecutive-day streak (days with at least 1 hire) ending today or yesterday.
function computeStreak(rows: EvaluationListItem[]): number {
  const hireDays = new Set<string>();
  for (const r of rows) {
    if (r.hired_status === 'hired') {
      const d = new Date(r.hired_at ?? r.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      hireDays.add(key);
    }
  }
  if (hireDays.size === 0) return 0;
  // Walk back from today
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (hireDays.has(key)) {
      streak += 1;
    } else if (streak > 0) {
      break;
    } else if (i > 1) {
      // tolerate today not having a hire — start counting from yesterday
      break;
    }
  }
  return streak;
}

// ─── Lead-quality donut (compact SVG ~32px) ──────────────────────────────────

function LeadQualityDonut({ stats, size = 32 }: { stats: RecruiterStats['by_status']; size?: number }) {
  const total = stats.elite + stats.calificado + stats.potencial + stats.descartado;
  if (total === 0) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted/30 border border-border" title="Sin datos" />
    );
  }
  const segments: { label: string; value: number; color: string }[] = [
    { label: 'Elite',       value: stats.elite,       color: '#22C55E' },
    { label: 'Calificado',  value: stats.calificado,  color: '#D4AF37' },
    { label: 'Potencial',   value: stats.potencial,   color: '#F59E0B' },
    { label: 'Descartado',  value: stats.descartado,  color: '#6B7280' },
  ];
  const radius = size / 2 - 3;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = segments.map((s, i) => {
    const len = (s.value / total) * circumference;
    const arc = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="transparent"
        stroke={s.color}
        strokeWidth={4}
        strokeDasharray={`${len} ${circumference - len}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += len;
    return arc;
  });
  const title = segments.map(s => `${s.label}: ${s.value}`).join(' · ');
  return (
    <svg width={size} height={size} className="shrink-0" viewBox={`0 0 ${size} ${size}`}>
      <title>{title}</title>
      <circle cx={cx} cy={cy} r={radius} fill="transparent" stroke="rgba(120,120,120,0.15)" strokeWidth={4} />
      {arcs}
    </svg>
  );
}

// ─── Podium card ──────────────────────────────────────────────────────────────

const MEDAL = ['🥇', '🥈', '🥉'] as const;
const PODIUM_STYLE = [
  'border-primary/50 bg-primary/10 shadow-[0_0_24px_-12px_rgba(212,175,55,0.6)]',
  'border-success/40 bg-success/10',
  'border-warning/40 bg-warning/10',
] as const;

function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: 0 | 1 | 2 }) {
  const { t } = useLanguage();
  const goalText = t('admin_perf_x_of_y', { count: entry.hire_count, goal: entry.monthly_goal });
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.08 }}
      className={`glass-card rounded-xl p-5 border ${PODIUM_STYLE[position]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{MEDAL[position]}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          #{position + 1}
        </span>
      </div>
      <p className="text-foreground font-bold text-lg truncate">{entry.name}</p>
      <p className="text-muted-foreground text-xs mt-0.5 truncate">{entry.label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`font-bold text-3xl ${position === 0 ? 'text-primary' : 'text-foreground'}`}>
          {entry.hire_count}
        </span>
        <span className="text-xs text-muted-foreground">{goalText}</span>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PerformancePanel({ onJumpToAbandoned }: Props) {
  const { t } = useLanguage();
  const [recruiters, setRecruiters] = useState<RecruiterFull[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [statsByLabel, setStatsByLabel] = useState<Record<string, RecruiterStats>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('hires_mes');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [abandonedCount, setAbandonedCount] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recRes, gamRes] = await Promise.all([
        apiRecruiters.list(),
        recruiterAnalytics.gamification(),
      ]);
      const recList = (recRes.rows ?? []) as RecruiterFull[];
      setRecruiters(recList);
      setLeaderboard(gamRes.leaderboard ?? []);

      // Per-recruiter stats from evaluations list (client-side fallback)
      const statsMap: Record<string, RecruiterStats> = {};
      const goalByLabel: Record<string, number> = {};
      for (const e of gamRes.leaderboard ?? []) {
        goalByLabel[e.label] = e.monthly_goal;
      }

      const activeRecruiters = recList.filter(r => toBool(r.active));
      const tasks = activeRecruiters.map(async (r) => {
        try {
          const evRes = await apiEvaluations.list({ assigned_to: r.label, limit: 500 });
          const rows = evRes.rows ?? [];
          const monthRows = rows.filter(x => isThisMonth(x.created_at));
          const hires = rows.filter(x => x.hired_status === 'hired');
          const hiresMes = rows.filter(x => x.hired_status === 'hired'
            && x.hired_at != null && isThisMonth(x.hired_at)).length
            || hires.filter(x => isThisMonth(x.created_at)).length;

          const scheduled = rows.filter(x => x.interview_status === 'agendada'
            || x.interview_status === 'entrevistado'
            || x.interview_status === 'reprogramado').length;
          const hireRate = scheduled > 0 ? Math.round((hires.length / scheduled) * 100) : 0;

          // Avg assign(created) → schedule
          const scheduleDeltas: number[] = [];
          for (const x of rows) {
            if (x.interview_date && x.created_at) {
              const d = (new Date(x.interview_date).getTime() - new Date(x.created_at).getTime()) / 3600000;
              if (d > 0 && d < 24 * 90) scheduleDeltas.push(d);
            }
          }
          const avgAssignToSchedule = scheduleDeltas.length
            ? scheduleDeltas.reduce((a, b) => a + b, 0) / scheduleDeltas.length
            : null;

          // Avg schedule → hired
          const hireDeltas: number[] = [];
          for (const x of rows) {
            if (x.hired_status === 'hired' && x.hired_at && x.interview_date) {
              const d = (new Date(x.hired_at).getTime() - new Date(x.interview_date).getTime()) / 3600000;
              if (d > 0 && d < 24 * 90) hireDeltas.push(d);
            }
          }
          const avgScheduleToHire = hireDeltas.length
            ? hireDeltas.reduce((a, b) => a + b, 0) / hireDeltas.length
            : null;

          const byStatus = {
            elite:      monthRows.filter(x => x.status === 'elite').length,
            calificado: monthRows.filter(x => x.status === 'calificado').length,
            potencial:  monthRows.filter(x => x.status === 'potencial').length,
            descartado: monthRows.filter(x => x.status === 'descartado').length,
          };

          const companies = (r.companies ?? [])
            .filter(c => toBool(c.active))
            .map(c => c.company);

          const monthlyGoal = goalByLabel[r.label] ?? r.monthly_goal ?? 6;

          statsMap[r.label] = {
            id: r.id,
            name: r.name,
            label: r.label,
            monthly_goal: monthlyGoal,
            hires_mes: hiresMes,
            scheduled,
            hired: hires.length,
            total: rows.length,
            hire_rate: hireRate,
            avg_assign_to_schedule_h: avgAssignToSchedule,
            avg_schedule_to_hire_h: avgScheduleToHire,
            by_status: byStatus,
            companies,
            active: toBool(r.active),
            streak: computeStreak(rows),
          };
        } catch {
          // Tolerate per-recruiter failures
        }
      });

      await Promise.all(tasks);
      setStatsByLabel(statsMap);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch abandoned count (≥24h)
  const fetchAbandonedCount = useCallback(async () => {
    try {
      const { analytics } = await import('@/lib/api');
      const res = await analytics.abandoned(24);
      setAbandonedCount(res.rows?.length ?? 0);
    } catch {
      setAbandonedCount(null);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchAbandonedCount(); }, [fetchAbandonedCount]);

  const sortedStats = useMemo(() => {
    const arr = Object.values(statsByLabel);
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const pick = (s: RecruiterStats): number | string => {
        switch (sortKey) {
          case 'name':       return s.name.toLowerCase();
          case 'companies':  return s.companies.join(',');
          case 'hires_mes':  return s.hires_mes;
          case 'monthly_goal': return s.monthly_goal;
          case 'hire_rate':  return s.hire_rate;
          case 'avg_assign_to_schedule_h': return s.avg_assign_to_schedule_h ?? Number.POSITIVE_INFINITY;
          case 'avg_schedule_to_hire_h':   return s.avg_schedule_to_hire_h ?? Number.POSITIVE_INFINITY;
          case 'streak':     return s.streak;
          default:           return 0;
        }
      };
      const av = pick(a);
      const bv = pick(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return arr;
  }, [statsByLabel, sortKey, sortDir]);

  const podium = useMemo(() => {
    return [...leaderboard]
      .sort((a, b) => b.hire_count - a.hire_count)
      .slice(0, 3);
  }, [leaderboard]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const handleJumpToAbandoned = () => {
    if (onJumpToAbandoned) {
      onJumpToAbandoned();
      toast.success(t('admin_perf_jump_abandoned_toast'));
    }
  };

  const sortIndicator = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="flex items-center gap-2 text-foreground font-semibold">
          <Trophy className="w-4 h-4 text-primary" />
          {t('admin_perf_title')}
        </h3>
        <button
          onClick={() => { fetchAll(); fetchAbandonedCount(); }}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {t('admin_btn_refresh')}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchAll} className="ml-auto underline hover:no-underline">{t('admin_btn_retry')}</button>
        </div>
      )}

      {loading && Object.keys(statsByLabel).length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Podium (top 3) */}
      <section>
        <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-3">
          {t('admin_perf_podium_title')}
        </h4>
        {podium.length === 0 ? (
          <p className="text-muted-foreground text-sm bg-muted/10 rounded-xl p-4">
            {t('admin_perf_podium_empty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {podium.map((e, i) => (
              <PodiumCard key={e.label} entry={e} position={i as 0 | 1 | 2} />
            ))}
          </div>
        )}
      </section>

      {/* Quick actions row */}
      <section className="glass-card rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={15} className="text-primary" />
          <span className="text-muted-foreground">{t('admin_perf_quick_actions')}</span>
        </div>
        <button
          onClick={handleJumpToAbandoned}
          disabled={!onJumpToAbandoned}
          className="text-xs px-3 py-1.5 rounded-lg border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('admin_perf_btn_view_abandoned', { count: abandonedCount ?? '...' })}
        </button>
      </section>

      {/* Comparison table */}
      <section>
        <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-3">
          {t('admin_perf_comparison_title')}
        </h4>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  {([
                    ['name',       t('admin_perf_col_recruiter')],
                    ['companies',  t('admin_perf_col_companies')],
                    ['hires_mes',  t('admin_perf_col_hires_mes')],
                    ['monthly_goal', t('admin_perf_col_goal')],
                    ['hire_rate',  t('admin_perf_col_hire_rate')],
                    ['avg_assign_to_schedule_h', t('admin_perf_col_assign_to_schedule')],
                    ['avg_schedule_to_hire_h',   t('admin_perf_col_schedule_to_hire')],
                    [null,         t('admin_perf_col_lead_quality')],
                    ['streak',     t('admin_perf_col_streak')],
                  ] as [SortKey | null, string][]).map(([key, label]) => (
                    <th
                      key={label}
                      onClick={key ? () => handleSort(key) : undefined}
                      className={`text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wider ${
                        key ? 'cursor-pointer hover:text-foreground select-none' : ''
                      }`}
                    >
                      {label}{key ? sortIndicator(key) : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((s) => (
                  <tr key={s.id} className="border-b border-border/40 hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-foreground font-medium">{s.name}</div>
                      <div className="text-muted-foreground text-[10px]">{s.label}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.companies.length === 0 ? (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        ) : (
                          s.companies.map(c => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-muted/20 text-muted-foreground border-border capitalize"
                            >
                              {c}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${s.hires_mes >= s.monthly_goal ? 'text-success' : 'text-foreground'}`}>
                        {s.hires_mes}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.monthly_goal}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${s.hire_rate >= 50 ? 'text-success' : s.hire_rate >= 25 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {s.hire_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatHoursOrDays(s.avg_assign_to_schedule_h)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatHoursOrDays(s.avg_schedule_to_hire_h)}
                    </td>
                    <td className="px-4 py-3">
                      <LeadQualityDonut stats={s.by_status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-foreground font-bold text-base">
                        <Flame size={14} className="text-warning" />
                        {s.streak}
                      </span>
                    </td>
                  </tr>
                ))}
                {sortedStats.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                      {t('admin_perf_sin_data')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">
          {t('admin_perf_recruiters_count', { count: recruiters.filter(r => toBool(r.active)).length })}
        </p>
      </section>
    </div>
  );
}

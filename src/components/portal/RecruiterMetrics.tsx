// src/components/portal/RecruiterMetrics.tsx
// Dashboard de métricas para el portal del reclutador.
// Recibe la lista completa de evaluaciones y la filtra por rango de tiempo.

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { recruiterAnalytics, type TeamStatsResponse, type GamificationResponse } from '@/lib/api';
import PendingActions from '@/components/portal/insights/PendingActions';
import LeadQuality from '@/components/portal/insights/LeadQuality';
import CloserVelocity from '@/components/portal/insights/CloserVelocity';
import HireBreakdown from '@/components/portal/insights/HireBreakdown';
import Streak from '@/components/portal/insights/Streak';
import Projection from '@/components/portal/insights/Projection';
import Leaderboard from '@/components/portal/insights/Leaderboard';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RecruiterMetricsEvaluation {
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

interface Props {
  evaluations: RecruiterMetricsEvaluation[];
  /** El label del reclutador logueado, para destacarlo en el leaderboard. */
  myLabel?: string | null;
}

type RangeKey = 'today' | '7d' | '30d' | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeStart(range: RangeKey): Date | null {
  const now = new Date();
  if (range === 'all') return null;
  if (range === 'today') return startOfDay(now);
  const days = range === '7d' ? 7 : 30;
  const x = startOfDay(now);
  x.setDate(x.getDate() - (days - 1));
  return x;
}

function inRange(ev: RecruiterMetricsEvaluation, from: Date | null): boolean {
  if (!from) return true;
  const t = new Date(ev.created_at).getTime();
  return !Number.isNaN(t) && t >= from.getTime();
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function RecruiterMetrics({ evaluations, myLabel }: Props) {
  const { t } = useLanguage();
  const [range, setRange] = useState<RangeKey>('30d');
  const [insights, setInsights] = useState<TeamStatsResponse | null>(null);
  const [gamification, setGamification] = useState<GamificationResponse | null>(null);

  useEffect(() => {
    Promise.allSettled([
      recruiterAnalytics.teamStats(),
      recruiterAnalytics.gamification(),
    ]).then(([teamRes, gameRes]) => {
      if (teamRes.status === 'fulfilled') setInsights(teamRes.value);
      if (gameRes.status === 'fulfilled') setGamification(gameRes.value);
    });
  }, []);

  const from = useMemo(() => rangeStart(range), [range]);

  const windowed = useMemo(
    () => evaluations.filter(e => inRange(e, from)),
    [evaluations, from],
  );

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = windowed.length;
    const scheduled = windowed.filter(e => e.interview_status === 'agendada').length;
    const interviewed = windowed.filter(e => e.interview_status === 'entrevistado').length;
    const hired = windowed.filter(e => e.hired_status === 'hired').length;
    const noShows = windowed.filter(
      e => e.interview_status === 'no_asistio' || e.hired_status === 'no_show',
    ).length;
    const hireRate = scheduled > 0 ? Math.round((hired / scheduled) * 100) : null;
    return { total, scheduled, interviewed, hired, noShows, hireRate };
  }, [windowed]);

  // ─── Funnel (acumulativo: cada etapa incluye las posteriores) ──────────────
  const funnel = useMemo(() => {
    const assigned = windowed.length;
    // "Agendado" en algún punto del flujo: si está agendado, entrevistado o contratado
    const scheduled = windowed.filter(e =>
      e.interview_status === 'agendada' ||
      e.interview_status === 'entrevistado' ||
      e.hired_status === 'hired',
    ).length;
    const interviewed = windowed.filter(e =>
      e.interview_status === 'entrevistado' || e.hired_status === 'hired',
    ).length;
    const hired = windowed.filter(e => e.hired_status === 'hired').length;
    return { assigned, scheduled, interviewed, hired };
  }, [windowed]);

  // ─── Empresa split ─────────────────────────────────────────────────────────
  const companySplit = useMemo(() => {
    const trebolife = windowed.filter(e => e.company === 'trebolife').length;
    const traduce = windowed.filter(e => e.company === 'traduce').length;
    const unassigned = windowed.filter(e => e.company === null).length;
    const total = windowed.length;
    return { trebolife, traduce, unassigned, total };
  }, [windowed]);

  // ─── Tendencia 14 días ─────────────────────────────────────────────────────
  const trend = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = evaluations.filter(e => {
        const ts = new Date(e.created_at).getTime();
        return !Number.isNaN(ts) && ts >= d.getTime() && ts < next.getTime();
      }).length;
      days.push({
        label: `${d.getDate()}`,
        count,
      });
    }
    const total = days.reduce((acc, d) => acc + d.count, 0);
    const max = Math.max(1, ...days.map(d => d.count));
    const avg = days.length > 0 ? Math.round((total / days.length) * 10) / 10 : 0;
    return { days, total, max, avg };
  }, [evaluations]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const ranges: { key: RangeKey; label: string }[] = [
    { key: 'today', label: t('metrics_range_today') },
    { key: '7d',    label: t('metrics_range_7d') },
    { key: '30d',   label: t('metrics_range_30d') },
    { key: 'all',   label: t('metrics_range_all') },
  ];

  return (
    <div className="space-y-6">
      {/* ─── 1. Filtro de rango ─────────────────────────────────────────── */}
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/30 border border-border">
          {ranges.map(r => {
            const active = r.key === range;
            return (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={
                  'px-3 py-1.5 text-xs font-medium rounded-full transition-colors ' +
                  (active
                    ? 'gold-gradient text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted')
                }
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. KPI Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label={t('metrics_kpi_candidates')}
          value={String(kpis.total)}
          colorClass="text-foreground"
          delay={0}
        />
        <KpiCard
          label={t('metrics_kpi_scheduled')}
          value={String(kpis.scheduled)}
          colorClass="text-primary"
          delay={0.05}
        />
        <KpiCard
          label={t('metrics_kpi_interviewed')}
          value={String(kpis.interviewed)}
          colorClass="text-success"
          delay={0.1}
        />
        <KpiCard
          label={t('metrics_kpi_hired')}
          value={String(kpis.hired)}
          colorClass="text-success"
          delay={0.15}
        />
        <KpiCard
          label={t('metrics_kpi_hire_rate')}
          value={kpis.hireRate === null ? '—' : `${kpis.hireRate} %`}
          colorClass="text-primary"
          delay={0.2}
        />
        <KpiCard
          label={t('metrics_kpi_no_shows')}
          value={String(kpis.noShows)}
          colorClass="text-destructive"
          delay={0.25}
        />
      </div>

      {/* ─── 3. Funnel ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {t('metrics_funnel_title')}
        </h3>

        {funnel.assigned === 0 ? (
          <p className="text-xs text-muted-foreground">{t('metrics_empty')}</p>
        ) : (
          <div className="space-y-3">
            <FunnelRow
              label={t('metrics_funnel_assigned')}
              count={funnel.assigned}
              prevCount={null}
              firstStageCount={funnel.assigned}
              barClass="bg-foreground/30"
              vsLabel={t('metrics_funnel_vs_prev', { percent: 100 })}
              hideVs
            />
            <FunnelRow
              label={t('metrics_funnel_scheduled')}
              count={funnel.scheduled}
              prevCount={funnel.assigned}
              firstStageCount={funnel.assigned}
              barClass="bg-primary"
              vsLabel={t('metrics_funnel_vs_prev', {
                percent: funnel.assigned > 0
                  ? Math.round((funnel.scheduled / funnel.assigned) * 100)
                  : 0,
              })}
            />
            <FunnelRow
              label={t('metrics_funnel_interviewed')}
              count={funnel.interviewed}
              prevCount={funnel.scheduled}
              firstStageCount={funnel.assigned}
              barClass="bg-warning"
              vsLabel={t('metrics_funnel_vs_prev', {
                percent: funnel.scheduled > 0
                  ? Math.round((funnel.interviewed / funnel.scheduled) * 100)
                  : 0,
              })}
            />
            <FunnelRow
              label={t('metrics_funnel_hired')}
              count={funnel.hired}
              prevCount={funnel.interviewed}
              firstStageCount={funnel.assigned}
              barClass="bg-success"
              vsLabel={t('metrics_funnel_vs_prev', {
                percent: funnel.interviewed > 0
                  ? Math.round((funnel.hired / funnel.interviewed) * 100)
                  : 0,
              })}
            />
          </div>
        )}
      </motion.div>

      {/* ─── 4. Empresa + Tendencia ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Empresa split */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {t('metrics_company_title')}
          </h3>

          {companySplit.total === 0 ? (
            <p className="text-xs text-muted-foreground">{t('metrics_empty')}</p>
          ) : (
            <div className="space-y-4">
              <CompanyRow
                label={t('metrics_company_trebolife')}
                count={companySplit.trebolife}
                total={companySplit.total}
                dotClass="bg-success"
                barClass="bg-success"
              />
              <CompanyRow
                label={t('metrics_company_traduce')}
                count={companySplit.traduce}
                total={companySplit.total}
                dotClass="bg-primary"
                barClass="bg-primary"
              />
              {companySplit.unassigned > 0 && (
                <CompanyRow
                  label={t('metrics_company_unassigned')}
                  count={companySplit.unassigned}
                  total={companySplit.total}
                  dotClass="bg-muted-foreground"
                  barClass="bg-muted-foreground/60"
                />
              )}
            </div>
          )}
        </motion.div>

        {/* Tendencia 14 días */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {t('metrics_trend_title')}
          </h3>

          <div className="flex items-end gap-1 h-24">
            {trend.days.map((d, i) => {
              const heightPct = (d.count / trend.max) * 100;
              const minPx = 4;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-primary/60 hover:bg-primary transition-colors"
                  style={{
                    height: d.count === 0
                      ? `${minPx}px`
                      : `max(${minPx}px, ${heightPct}%)`,
                  }}
                  title={`${d.label}: ${d.count}`}
                />
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('metrics_trend_total', { n: trend.total })}</span>
            <span>{t('metrics_trend_avg', { n: trend.avg })}</span>
          </div>
        </motion.div>
      </div>

      {/* ─── 5. Insights: Pendientes accionables ─────────────────────────── */}
      <PendingActions data={insights?.pending} />

      {/* ─── 6. Insights: Calidad + Velocidad ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeadQuality mine={insights?.mine} team={insights?.team} />
        <CloserVelocity mine={insights?.mine} team={insights?.team} />
      </div>

      {/* ─── 7. Insights: Perfil de cierres ──────────────────────────────── */}
      <HireBreakdown hires={insights?.hires ?? []} />

      {/* ─── 8. FASE 9: Gamification — Streak + Projection lado a lado ───── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Streak data={gamification?.my_streak ?? null} />
        <Projection data={gamification?.my_projection ?? null} />
      </div>

      {/* ─── 9. FASE 9: Gamification — Leaderboard a todo el ancho ───────── */}
      <Leaderboard
        entries={gamification?.leaderboard ?? []}
        myLabel={myLabel ?? null}
      />
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  colorClass,
  delay,
}: {
  label: string;
  value: string;
  colorClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-xl p-4"
    >
      <p className="text-muted-foreground text-xs mb-1.5">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </motion.div>
  );
}

function FunnelRow({
  label,
  count,
  firstStageCount,
  barClass,
  vsLabel,
  hideVs,
}: {
  label: string;
  count: number;
  prevCount: number | null;
  firstStageCount: number;
  barClass: string;
  vsLabel: string;
  hideVs?: boolean;
}) {
  const widthPct = firstStageCount > 0
    ? Math.max(4, (count / firstStageCount) * 100)
    : 4;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-foreground font-medium">
          {label}: <span className="text-foreground">{count}</span>
        </span>
        {!hideVs && (
          <span className="text-muted-foreground">{vsLabel}</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
    </div>
  );
}

function CompanyRow({
  label,
  count,
  total,
  dotClass,
  barClass,
}: {
  label: string;
  count: number;
  total: number;
  dotClass: string;
  barClass: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="flex items-center gap-2 text-foreground">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          {label}
        </span>
        <span className="text-muted-foreground">
          {count} <span className="text-muted-foreground/60">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
    </div>
  );
}

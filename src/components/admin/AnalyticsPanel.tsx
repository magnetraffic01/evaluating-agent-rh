// src/components/admin/AnalyticsPanel.tsx
// Panel de Analytics que consume /api/hr/analytics/funnel + /abandoned.
// Usa recharts para barras y CSS para los demás KPIs.

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, TrendingUp, Clock, MessageCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useFunnel } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { analytics as apiAnalytics, type AbandonedRow, ApiError } from '@/lib/api';

type CompanyFilter = '' | 'trebolife' | 'traduce';
type TimeRange = 'all' | 'today' | '7d' | '30d';

const RANGE_HOURS: Record<TimeRange, number | undefined> = {
  all:   undefined,
  today: 24,
  '7d':  24 * 7,
  '30d': 24 * 30,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function formatSecs(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function hoursAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 3600000));
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'text-foreground' }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── CSS bar ──────────────────────────────────────────────────────────────────

function CssBar({ label, value, total, color }: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const p = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground w-28 shrink-0 text-xs">{label}</span>
      <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="w-16 text-right text-xs text-muted-foreground">
        {value.toLocaleString()} ({p}%)
      </span>
    </div>
  );
}

// ─── Abandoned Section ────────────────────────────────────────────────────────

function AbandonedSection() {
  const { t } = useLanguage();
  const [hours, setHours] = useState<number>(24);
  const [rows, setRows] = useState<AbandonedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAnalytics.abandoned(hours);
      setRows(res.rows ?? []);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const buildWhatsAppLink = (row: AbandonedRow): string => {
    // Sanitize phone: keep digits + leading + only
    const phone = (row.phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
    const greeting = `Hola ${row.name}, notamos que comenzaste pero no terminaste la evaluacion. ¿Quieres que te ayude a continuar?`;
    const text = encodeURIComponent(greeting);
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <section id="admin-abandoned-section" className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h4 className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <Clock size={14} className="text-warning" />
          {t('admin_abandoned_title', { hours })}
        </h4>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('admin_abandoned_hours')}</label>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {[4, 12, 24, 48, 72].map(h => (
              <option key={h} value={h}>{h}h</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={14} />{error}
        </p>
      )}

      {!loading && rows.length === 0 && !error && (
        <p className="text-sm text-muted-foreground bg-muted/10 rounded-xl p-4">
          {t('admin_abandoned_empty')}
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                {[
                  t('admin_abandoned_col_name'),
                  t('admin_abandoned_col_phone'),
                  t('admin_abandoned_col_step'),
                  t('admin_abandoned_col_inactive'),
                  '',
                ].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-3 py-2 text-xs uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-primary/5 transition-colors">
                  <td className="px-3 py-2 text-foreground font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{r.phone}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.current_step}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {hoursAgo(r.last_activity)}h
                  </td>
                  <td className="px-3 py-2 text-right">
                    <a
                      href={buildWhatsAppLink(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-success/40 bg-success/10 text-success hover:bg-success/20 transition-all"
                    >
                      <MessageCircle size={12} />
                      {t('admin_abandoned_reactivate')}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsPanel() {
  const { t } = useLanguage();
  const [company, setCompany] = useState<CompanyFilter>('');
  const [range, setRange] = useState<TimeRange>('30d');
  const { data, loading, error, refetch } = useFunnel(
    company || undefined,
    RANGE_HOURS[range],
  );

  // Derived
  const total = data?.total ?? 0;
  const byStatus = data?.by_status ?? {};
  const byDevice = data?.by_device ?? {};
  const byStep = data?.by_step ?? {};
  const avgDuration = data?.avg_step_duration ?? {};

  const completed = (byStatus.elite ?? 0) + (byStatus.calificado ?? 0) +
    (byStatus.potencial ?? 0) + (byStatus.descartado ?? 0);
  const conversionPct = completed ? Math.round(((byStatus.elite ?? 0 + (byStatus.calificado ?? 0)) / completed) * 100) : 0;

  // Step funnel chart data
  const stepData = Object.entries(byStep)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([step, count]) => ({
      name: `Step ${step}`,
      count: count as number,
    }));

  const statusRows: { key: string; label: string; color: string }[] = [
    { key: 'elite',       label: 'Elite',        color: 'bg-primary'     },
    { key: 'calificado',  label: 'Calificado',   color: 'bg-success'     },
    { key: 'potencial',   label: 'Potencial',    color: 'bg-warning'     },
    { key: 'descartado',  label: 'Descartado',   color: 'bg-destructive' },
    { key: 'en_progreso', label: 'En progreso',  color: 'bg-muted-foreground' },
  ];

  const deviceRows: { key: string; label: string; color: string }[] = [
    { key: 'mobile',  label: 'Movil',   color: 'bg-primary'     },
    { key: 'desktop', label: 'Desktop', color: 'bg-success'     },
    { key: 'tablet',  label: 'Tablet',  color: 'bg-warning'     },
    { key: 'unknown', label: 'Descon.', color: 'bg-muted-foreground' },
  ];

  const totalDevices = Object.values(byDevice).reduce((s, v) => s + (v as number), 0);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-foreground font-semibold">{t('admin_analytics_title')}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range filter */}
          <div className="flex gap-1 bg-muted/20 rounded-xl p-1" title={t('admin_analytics_temporal_tooltip')}>
            {([
              ['today', t('admin_analytics_range_today')],
              ['7d',    t('admin_analytics_range_7d')],
              ['30d',   t('admin_analytics_range_30d')],
              ['all',   t('admin_analytics_range_all')],
            ] as [TimeRange, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  range === val
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Company filter */}
          <div className="flex gap-1 bg-muted/20 rounded-xl p-1">
            {([
              ['',          t('admin_analytics_company_all')],
              ['trebolife', 'Trebolife'],
              ['traduce',   'Traduce'],
            ] as [CompanyFilter, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setCompany(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  company === val
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Note about temporal filter (visible if not 'all') */}
      {range !== 'all' && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70 bg-muted/10 rounded-lg px-3 py-2">
          <Info size={12} />
          <span>{t('admin_analytics_temporal_note')}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{t('admin_analytics_error', { error })}</span>
          <button onClick={refetch} className="ml-auto underline hover:no-underline">{t('admin_btn_retry')}</button>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">{t('admin_analytics_loading')}</p>
          </div>
        </div>
      )}

      {/* No data placeholder */}
      {!loading && !error && !data && (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <TrendingUp size={32} className="text-muted-foreground/30" />
          <p className="text-sm">{t('admin_analytics_no_data')}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* KPIs row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label={t('admin_analytics_kpi_total')}
              value={total.toLocaleString()}
              color="text-foreground"
            />
            <KpiCard
              label={t('admin_analytics_kpi_completed')}
              value={completed.toLocaleString()}
              sub={`${pct(completed, total)} ${t('admin_analytics_of_total')}`}
              color="text-primary"
            />
            <KpiCard
              label={t('admin_analytics_kpi_conversion')}
              value={`${conversionPct}%`}
              sub={t('admin_analytics_of_completed')}
              color={conversionPct >= 30 ? 'text-success' : 'text-warning'}
            />
            <KpiCard
              label={t('admin_analytics_kpi_in_progress')}
              value={(byStatus.en_progreso ?? 0).toLocaleString()}
              sub={`${pct(byStatus.en_progreso ?? 0, total)} ${t('admin_analytics_of_total')}`}
              color="text-muted-foreground"
            />
          </div>

          {/* Step funnel */}
          {stepData.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-foreground font-semibold text-sm mb-4">{t('admin_analytics_funnel_title')}</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stepData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#FFFFFF',
                    }}
                    cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stepData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#D4AF37' : `rgba(212,175,55,${Math.max(0.2, 1 - index * 0.15)})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Two columns: status + device */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* By status */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h4 className="text-foreground font-semibold text-sm">{t('admin_analytics_by_status')}</h4>
              {statusRows.map(({ key, label, color }) => {
                const val = (byStatus[key] as number) ?? 0;
                return (
                  <CssBar key={key} label={label} value={val} total={total} color={color} />
                );
              })}
            </div>

            {/* By device */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h4 className="text-foreground font-semibold text-sm">{t('admin_analytics_by_device')}</h4>
              {deviceRows.map(({ key, label, color }) => {
                const val = (byDevice[key] as number) ?? 0;
                if (!val && key === 'tablet') return null;
                return (
                  <CssBar key={key} label={label} value={val} total={totalDevices} color={color} />
                );
              })}
            </div>
          </div>

          {/* Avg step duration */}
          {Object.keys(avgDuration).length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-foreground font-semibold text-sm mb-4">
                {t('admin_analytics_avg_step_title')}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(avgDuration)
                  .sort(([a], [b]) => {
                    const na = parseInt(a.replace(/\D/g, ''));
                    const nb = parseInt(b.replace(/\D/g, ''));
                    return na - nb;
                  })
                  .map(([step, secs]) => (
                    <div key={step} className="bg-muted/10 rounded-xl p-3 text-center">
                      <p className="text-muted-foreground text-xs mb-1">{step.replace('_', ' ')}</p>
                      <p className="text-foreground font-bold">{formatSecs(secs as number)}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Abandoned candidates section */}
      <AbandonedSection />
    </div>
  );
}

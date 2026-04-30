// src/components/admin/AnalyticsPanel.tsx
// Panel de Analytics que consume /api/hr/analytics/funnel.
// Usa recharts para barras y CSS para los demás KPIs.

import { useState } from 'react';
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
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

type CompanyFilter = '' | 'trebolife' | 'traduce';

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

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsPanel() {
  const [company, setCompany] = useState<CompanyFilter>('');
  const { data, loading, error, refetch } = useFunnel(company || undefined);

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

  // Status colors
  const STATUS_COLORS: Record<string, string> = {
    elite:       '#D4AF37',
    calificado:  '#22C55E',
    potencial:   '#F59E0B',
    descartado:  '#EF4444',
    en_progreso: '#6B7280',
  };

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
        <h3 className="text-foreground font-semibold">Analytics del Funnel</h3>
        <div className="flex items-center gap-2">
          {/* Company filter */}
          <div className="flex gap-1 bg-muted/20 rounded-xl p-1">
            {([['', 'Todos'], ['trebolife', 'Trebolife'], ['traduce', 'Traduce']] as [CompanyFilter, string][]).map(([val, label]) => (
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

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>No se pudo cargar analytics: {error}</span>
          <button onClick={refetch} className="ml-auto underline hover:no-underline">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Cargando analytics...</p>
          </div>
        </div>
      )}

      {/* No data placeholder */}
      {!loading && !error && !data && (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <TrendingUp size={32} className="text-muted-foreground/30" />
          <p className="text-sm">Sin datos de analytics disponibles</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* KPIs row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Total evaluaciones"
              value={total.toLocaleString()}
              color="text-foreground"
            />
            <KpiCard
              label="Completadas"
              value={completed.toLocaleString()}
              sub={pct(completed, total) + ' del total'}
              color="text-primary"
            />
            <KpiCard
              label="Conversión (elite+cal.)"
              value={`${conversionPct}%`}
              sub="de completadas"
              color={conversionPct >= 30 ? 'text-success' : 'text-warning'}
            />
            <KpiCard
              label="En progreso"
              value={(byStatus.en_progreso ?? 0).toLocaleString()}
              sub={pct(byStatus.en_progreso ?? 0, total) + ' del total'}
              color="text-muted-foreground"
            />
          </div>

          {/* Step funnel */}
          {stepData.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-foreground font-semibold text-sm mb-4">Abandono por Step</h4>
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
              <h4 className="text-foreground font-semibold text-sm">Por Resultado</h4>
              {statusRows.map(({ key, label, color }) => {
                const val = (byStatus[key] as number) ?? 0;
                return (
                  <CssBar key={key} label={label} value={val} total={total} color={color} />
                );
              })}
            </div>

            {/* By device */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h4 className="text-foreground font-semibold text-sm">Por Dispositivo</h4>
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
                Tiempo promedio por step (segundos)
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
    </div>
  );
}

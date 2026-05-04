// src/components/portal/insights/LeadQuality.tsx
// Donut SVG de calidad de leads del recruiter + comparación con el equipo.

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ScopeStats } from '@/lib/api';

interface Props {
  mine: ScopeStats | null | undefined;
  team: ScopeStats | null | undefined;
}

type StatusKey = 'elite' | 'calificado' | 'potencial' | 'descartado';

interface RowSpec {
  key: StatusKey;
  labelKey: string;
  colorClass: string; // text-* used for stroke via currentColor
  fillVar: string;    // hex used directly in SVG stroke
}

// Hex values pulled from CLAUDE.md design tokens — drives the SVG strokes.
// Tailwind `currentColor` works only if we set color via class on the path.
const ROWS: RowSpec[] = [
  { key: 'elite',       labelKey: 'portal_status_elite',       colorClass: 'text-success',     fillVar: '#22C55E' },
  { key: 'calificado',  labelKey: 'portal_status_calificado',  colorClass: 'text-primary',     fillVar: '#D4AF37' },
  { key: 'potencial',   labelKey: 'portal_status_potencial',   colorClass: 'text-warning',     fillVar: '#F59E0B' },
  { key: 'descartado',  labelKey: 'portal_status_descartado',  colorClass: 'text-destructive', fillVar: '#EF4444' },
];

function pctOf(stats: ScopeStats | null | undefined, key: StatusKey): number {
  if (!stats || !stats.lead_quality) return 0;
  switch (key) {
    case 'elite':       return stats.lead_quality.elite_pct;
    case 'calificado':  return stats.lead_quality.calificado_pct;
    case 'potencial':   return stats.lead_quality.potencial_pct;
    case 'descartado':  return stats.lead_quality.descartado_pct;
  }
}

function countOf(stats: ScopeStats | null | undefined, key: StatusKey): number {
  return stats?.by_status?.[key] ?? 0;
}

function fmtDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${Math.round(delta)}`;
}

export default function LeadQuality({ mine, team }: Props) {
  const { t } = useLanguage();

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (!mine || !mine.lead_quality || mine.total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
          <Target className="w-4 h-4 text-primary" />
          {t('insights_quality_title')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('insights_quality_empty')}</p>
      </motion.div>
    );
  }

  // ─── Donut math ────────────────────────────────────────────────────────────
  const RADIUS = 42;
  const STROKE = 14;
  const CIRC = 2 * Math.PI * RADIUS;
  let cumulative = 0;

  const arcs = ROWS.map(row => {
    const pct = pctOf(mine, row.key);
    const length = (pct / 100) * CIRC;
    const offset = -cumulative;
    cumulative += length;
    return { row, pct, length, offset };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Target className="w-4 h-4 text-primary" />
        {t('insights_quality_title')}
      </h3>

      <div className="flex items-center justify-center mb-6">
        <svg
          width="160"
          height="160"
          viewBox="0 0 100 100"
          className="-rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {arcs.map(({ row, length, offset }) => (
            <motion.circle
              key={row.key}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={row.fillVar}
              strokeWidth={STROKE}
              strokeDasharray={`${length} ${CIRC - length}`}
              strokeDashoffset={offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </svg>
      </div>

      <div className="space-y-2.5">
        {ROWS.map(row => {
          const minePct = pctOf(mine, row.key);
          const teamPct = pctOf(team, row.key);
          const delta = minePct - teamPct;
          const count = countOf(mine, row.key);
          const deltaClass = delta > 0
            ? 'text-success'
            : delta < 0
              ? 'text-destructive'
              : 'text-muted-foreground';

          return (
            <div
              key={row.key}
              className="flex items-center justify-between text-xs gap-3"
            >
              <span className="flex items-center gap-2 text-foreground min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: row.fillVar }}
                />
                <span className="font-medium truncate">{t(row.labelKey)}</span>
                <span className="text-muted-foreground">({count})</span>
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-semibold ${row.colorClass}`}>
                  {Math.round(minePct)}%
                </span>
                <span className={`text-[11px] ${deltaClass}`}>
                  ({fmtDelta(delta)} vs {t('insights_quality_team')})
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

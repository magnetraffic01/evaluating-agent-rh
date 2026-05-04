// src/components/portal/insights/CloserVelocity.tsx
// 3 KPIs de velocidad del closer con comparación vs equipo.

import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ScopeStats } from '@/lib/api';

interface Props {
  mine: ScopeStats | null | undefined;
  team: ScopeStats | null | undefined;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return '—';
  if (hours >= 24) {
    const days = hours / 24;
    return `${days.toFixed(1)} días`;
  }
  return `${Math.round(hours)}h`;
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return '—';
  return `${Math.round(score)} pts`;
}

// Para tiempos, "más rápido" = menor valor (mine < team).
// Devuelve { tone, label } donde tone ∈ verde / rojo / muted.
type Tone = 'good' | 'bad' | 'neutral';

function speedDelta(
  mine: number | null,
  team: number | null,
  t: (k: string, p?: Record<string, string | number>) => string,
): { tone: Tone; label: string } {
  if (mine === null || team === null) return { tone: 'neutral', label: '' };
  if (team === 0) return { tone: 'neutral', label: '' };
  const diffPct = Math.round(((team - mine) / team) * 100);
  if (diffPct > 0) {
    return { tone: 'good', label: t('insights_velocity_faster', { percent: diffPct }) };
  }
  if (diffPct < 0) {
    return { tone: 'bad', label: t('insights_velocity_slower', { percent: Math.abs(diffPct) }) };
  }
  return { tone: 'neutral', label: '' };
}

// Para score, mayor = mejor. Delta absoluto en pts.
function scoreDelta(
  mine: number | null,
  team: number | null,
): { tone: Tone; label: string } {
  if (mine === null || team === null) return { tone: 'neutral', label: '' };
  const diff = Math.round(mine - team);
  if (diff > 0) return { tone: 'good',    label: `+${diff} pts` };
  if (diff < 0) return { tone: 'bad',     label: `${diff} pts` };
  return         { tone: 'neutral', label: '0 pts' };
}

function toneClass(tone: Tone): string {
  if (tone === 'good') return 'text-success';
  if (tone === 'bad') return 'text-destructive';
  return 'text-muted-foreground';
}

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === 'good') return <TrendingUp className="w-3.5 h-3.5" />;
  if (tone === 'bad') return <TrendingDown className="w-3.5 h-3.5" />;
  return <Minus className="w-3.5 h-3.5" />;
}

// ─── Subcomponente row ──────────────────────────────────────────────────────

function VelocityRow({
  label,
  mineDisplay,
  teamDisplay,
  tone,
  deltaLabel,
}: {
  label: string;
  mineDisplay: string;
  teamDisplay: string;
  tone: Tone;
  deltaLabel: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-12 items-center gap-2 py-2.5 border-b border-border/40 last:border-0">
      <div className="col-span-5 text-xs text-foreground font-medium truncate">
        {label}
      </div>
      <div className="col-span-3 text-sm font-bold text-foreground">
        {mineDisplay}
      </div>
      <div className="col-span-4 text-right">
        <div className="text-[11px] text-muted-foreground">
          {t('insights_velocity_team', { value: teamDisplay })}
        </div>
        {deltaLabel && (
          <div className={`inline-flex items-center gap-1 text-[11px] font-medium ${toneClass(tone)}`}>
            <ToneIcon tone={tone} />
            {deltaLabel}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function CloserVelocity({ mine, team }: Props) {
  const { t } = useLanguage();

  const mineSched = mine?.avg_to_schedule_hours ?? null;
  const mineHire = mine?.avg_to_hire_hours ?? null;
  const mineScore = mine?.avg_score_hired ?? null;
  const teamSched = team?.avg_to_schedule_hours ?? null;
  const teamHire = team?.avg_to_hire_hours ?? null;
  const teamScore = team?.avg_score_hired ?? null;

  // Empty state: aún no tenemos data de tiempos ni de score promedio
  if (mineSched === null && mineHire === null && mineScore === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
          <Zap className="w-4 h-4 text-primary" />
          {t('insights_velocity_title')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('insights_velocity_empty')}</p>
      </motion.div>
    );
  }

  const schedDelta = speedDelta(mineSched, teamSched, t);
  const hireDelta = speedDelta(mineHire, teamHire, t);
  const scoreDeltaInfo = scoreDelta(mineScore, teamScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Zap className="w-4 h-4 text-primary" />
        {t('insights_velocity_title')}
      </h3>

      <div>
        <VelocityRow
          label={t('insights_velocity_to_schedule')}
          mineDisplay={formatHours(mineSched)}
          teamDisplay={formatHours(teamSched)}
          tone={schedDelta.tone}
          deltaLabel={schedDelta.label}
        />
        <VelocityRow
          label={t('insights_velocity_to_hire')}
          mineDisplay={formatHours(mineHire)}
          teamDisplay={formatHours(teamHire)}
          tone={hireDelta.tone}
          deltaLabel={hireDelta.label}
        />
        <VelocityRow
          label={t('insights_velocity_avg_score')}
          mineDisplay={formatScore(mineScore)}
          teamDisplay={formatScore(teamScore)}
          tone={scoreDeltaInfo.tone}
          deltaLabel={scoreDeltaInfo.label}
        />
      </div>
    </motion.div>
  );
}

// src/components/portal/insights/HireBreakdown.tsx
// Histograma horizontal de hires por bucket de score + insight textual.

import { motion } from 'framer-motion';
import { Award, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { HireScoreRow } from '@/lib/api';

interface Props {
  hires: HireScoreRow[];
}

interface BucketSpec {
  key: 'elite' | 'calificado' | 'potencial' | 'bajo';
  labelKey: string;
  // Inclusive lower bound, exclusive upper. `upper === null` means open-ended.
  lower: number;
  upper: number | null;
  colorClass: string;
  fill: string;
}

const BUCKETS: BucketSpec[] = [
  { key: 'elite',       labelKey: 'insights_breakdown_bucket_elite',      lower: 110, upper: null, colorClass: 'text-success',     fill: '#22C55E' },
  { key: 'calificado',  labelKey: 'insights_breakdown_bucket_calificado', lower: 90,  upper: 110,  colorClass: 'text-primary',     fill: '#D4AF37' },
  { key: 'potencial',   labelKey: 'insights_breakdown_bucket_potencial',  lower: 80,  upper: 90,   colorClass: 'text-warning',     fill: '#F59E0B' },
];

function bucketCount(hires: HireScoreRow[], spec: BucketSpec): number {
  return hires.filter(h => {
    if (h.score < spec.lower) return false;
    if (spec.upper !== null && h.score >= spec.upper) return false;
    return true;
  }).length;
}

function pickInsight(
  total: number,
  counts: Record<BucketSpec['key'], number>,
  t: (k: string, p?: Record<string, string | number>) => string,
): string {
  if (total === 0) return t('insights_breakdown_insight_empty');

  const eliteShare = counts.elite / total;
  const calificadoShare = counts.calificado / total;

  // "Mostly Elite" if Elite is at least 50% of total
  if (eliteShare >= 0.5) {
    return t('insights_breakdown_insight_elite', { n: counts.elite, total });
  }
  // "Mostly Calificado" if Calificado is at least 50%
  if (calificadoShare >= 0.5) {
    return t('insights_breakdown_insight_calificado', { n: counts.calificado, total });
  }
  return t('insights_breakdown_insight_mixed');
}

export default function HireBreakdown({ hires }: Props) {
  const { t } = useLanguage();

  const counts = {
    elite: bucketCount(hires, BUCKETS[0]),
    calificado: bucketCount(hires, BUCKETS[1]),
    potencial: bucketCount(hires, BUCKETS[2]),
    bajo: 0,
  };
  const total = hires.length;
  const max = Math.max(1, counts.elite, counts.calificado, counts.potencial);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Award className="w-4 h-4 text-primary" />
          {t('insights_breakdown_title')}
        </h3>
        <span className="text-xs text-muted-foreground">
          {total} {total === 1 ? 'hire' : 'hires'}
        </span>
      </div>

      {total === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('insights_breakdown_insight_empty')}
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {BUCKETS.map(spec => {
            const count = counts[spec.key];
            const widthPct = (count / max) * 100;
            return (
              <div key={spec.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-medium ${spec.colorClass}`}>
                    {t(spec.labelKey)}
                  </span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: count === 0 ? '4px' : `${Math.max(4, widthPct)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: spec.fill }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
          <Activity className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/70" />
          <p>{pickInsight(total, counts, t)}</p>
        </div>
      )}
    </motion.div>
  );
}

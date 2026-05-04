// src/components/portal/insights/Projection.tsx
// FASE 9 — Barra de progreso hacia el objetivo mensual + marker de proyección.

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProjectionInfo } from '@/lib/api';

interface Props {
  data: ProjectionInfo | null;
}

export default function Projection({ data }: Props) {
  const { t } = useLanguage();

  // Empty state — admin u otra fuente sin proyección
  if (data === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
          <Target className="w-4 h-4 text-primary" />
          {t('gamification_projection_title')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('gamification_streak_admin_only')}
        </p>
      </motion.div>
    );
  }

  const { actual, projected, goal, days_passed, days_in_month } = data;
  const safeGoal = goal > 0 ? goal : 1;
  const progressPct = Math.min(100, (actual / safeGoal) * 100);

  // Color de barra
  let barClass = 'bg-muted';
  if (actual >= goal) barClass = 'bg-success';
  else if (actual > 0) barClass = 'bg-primary';

  // Marker de proyección — posición sobre el track 0..goal+ (cap a 100%)
  const projectionPct = Math.min(100, (projected / safeGoal) * 100);

  // Estado textual debajo
  let statusLabel: string;
  let statusClass: string;
  if (projected > goal) {
    statusLabel = t('gamification_projection_above', { projected, goal });
    statusClass = 'text-success';
  } else if (projected === goal) {
    statusLabel = t('gamification_projection_match', { projected });
    statusClass = 'text-primary';
  } else {
    statusLabel = t('gamification_projection_below', { projected, goal });
    statusClass = 'text-warning';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Target className="w-4 h-4 text-primary" />
        {t('gamification_projection_title')}
      </h3>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-foreground">{actual}</span>
        <span className="text-xl text-muted-foreground">/ {goal}</span>
      </div>

      {/* Barra horizontal con marker de proyección */}
      <div className="relative">
        <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${barClass}`}
          />
        </div>

        {/* Marker de proyección */}
        {projected > 0 && projected !== actual && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: `${projectionPct}%` }}
          >
            <div className="w-px h-3 bg-foreground/70" />
            <div className="mt-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
              {t('gamification_projection_marker')}: {projected}
            </div>
          </div>
        )}
      </div>

      <p className={`mt-6 text-sm font-medium ${statusClass}`}>{statusLabel}</p>

      <p className="mt-2 text-xs text-muted-foreground">
        {t('gamification_projection_day', {
          day: days_passed,
          total: days_in_month,
        })}
      </p>
    </motion.div>
  );
}

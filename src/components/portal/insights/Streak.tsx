// src/components/portal/insights/Streak.tsx
// FASE 9 — Card visual con la racha activa y la mejor histórica.

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { StreakInfo } from '@/lib/api';

interface Props {
  data: StreakInfo | null;
}

function daysSince(dateStr: string): number {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export default function Streak({ data }: Props) {
  const { t } = useLanguage();

  // Empty state — admin u otra fuente sin streak
  if (data === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
          <Flame className="w-4 h-4 text-primary" />
          {t('gamification_streak_title')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('gamification_streak_admin_only')}
        </p>
      </motion.div>
    );
  }

  const isActive = data.current > 0;
  const isSingular = data.current === 1;

  let lastHireLabel: string | null = null;
  if (data.last_hire_at) {
    const d = daysSince(data.last_hire_at);
    if (d <= 0) {
      lastHireLabel = t('gamification_streak_last_hire_today');
    } else {
      lastHireLabel = t('gamification_streak_last_hire', { days: d });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-xl p-6 flex flex-col items-center text-center"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 self-start">
        <Flame className="w-4 h-4 text-primary" />
        {t('gamification_streak_title')}
      </h3>

      <Flame
        className={
          'w-12 h-12 mb-2 ' +
          (isActive ? 'text-primary' : 'text-muted-foreground/40')
        }
        strokeWidth={1.6}
      />

      {isActive ? (
        <>
          <p className="text-5xl font-bold text-primary leading-none">
            {data.current}
          </p>
          <p className="mt-2 text-sm text-foreground">
            {isSingular
              ? t('gamification_streak_day_singular')
              : t('gamification_streak_days')}
          </p>
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">
          {t('gamification_streak_zero')}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {t('gamification_streak_best', { days: data.best })}
      </p>

      {lastHireLabel && (
        <p className="mt-1 text-xs text-muted-foreground/80">{lastHireLabel}</p>
      )}
    </motion.div>
  );
}

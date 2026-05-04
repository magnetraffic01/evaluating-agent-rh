// src/components/portal/insights/Leaderboard.tsx
// FASE 9 — Top 10 del mes con podium para el 1°/2°/3° y highlight del usuario.

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LeaderboardEntry } from '@/lib/api';

interface Props {
  entries: LeaderboardEntry[];
  myLabel: string | null;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function currentMonthLabel(lang: 'es' | 'en'): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
  return capitalize(formatter.format(now));
}

const MEDAL = ['🥇', '🥈', '🥉'] as const;

export default function Leaderboard({ entries, myLabel }: Props) {
  const { t, lang } = useLanguage();
  const monthLabel = currentMonthLabel(lang);

  // Ordenamos defensivamente por hire_count desc; si vienen empatados respetamos el orden del backend.
  const sorted = [...entries].sort((a, b) => b.hire_count - a.hire_count);
  const top10 = sorted.slice(0, 10);
  const podium = top10.slice(0, 3);
  const rest = top10.slice(3);

  // Posición del usuario logueado dentro del ranking completo recibido
  const myIndex = myLabel
    ? sorted.findIndex(e => e.label === myLabel)
    : -1;
  const isInTop10 = myIndex >= 0 && myIndex < 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Trophy className="w-4 h-4 text-primary" />
          {t('gamification_leaderboard_title')}
        </h3>
        <span className="text-xs text-muted-foreground">{monthLabel}</span>
      </div>

      {top10.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('gamification_leaderboard_empty')}
        </p>
      ) : (
        <>
          {/* Podium 1°-3° */}
          {podium.length > 0 && (
            <div className="space-y-2 mb-3">
              {podium.map((entry, i) => {
                const isMe = myLabel !== null && entry.label === myLabel;
                const sizeClass =
                  i === 0
                    ? 'py-3 text-base'
                    : i === 1
                    ? 'py-2.5 text-sm'
                    : 'py-2.5 text-sm';
                return (
                  <div
                    key={entry.label}
                    className={
                      'flex items-center gap-3 px-3 rounded-lg transition-colors ' +
                      sizeClass +
                      ' ' +
                      (isMe
                        ? 'bg-primary/10 border border-primary/40'
                        : 'bg-muted/20 border border-transparent')
                    }
                  >
                    <span className={i === 0 ? 'text-2xl' : 'text-xl'}>
                      {MEDAL[i]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={
                          'truncate font-semibold ' +
                          (i === 0 ? 'text-foreground' : 'text-foreground')
                        }
                      >
                        {entry.name}
                        {isMe && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">
                            {t('gamification_leaderboard_you')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={
                          'font-bold ' +
                          (i === 0
                            ? 'text-2xl text-primary'
                            : 'text-lg text-foreground')
                        }
                      >
                        {entry.hire_count}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t('gamification_leaderboard_of_goal', {
                          count: entry.hire_count,
                          goal: entry.monthly_goal,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Posiciones 4-10 */}
          {rest.length > 0 && (
            <div className="space-y-1">
              {rest.map((entry, i) => {
                const position = i + 4;
                const isMe = myLabel !== null && entry.label === myLabel;
                return (
                  <div
                    key={entry.label}
                    className={
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ' +
                      (isMe
                        ? 'bg-primary/10 border border-primary/40'
                        : 'border border-transparent hover:bg-muted/20')
                    }
                  >
                    <span className="w-5 text-xs text-muted-foreground tabular-nums">
                      {position}.
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                    <p className="flex-1 min-w-0 truncate text-foreground">
                      {entry.name}
                      {isMe && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">
                          {t('gamification_leaderboard_you')}
                        </span>
                      )}
                    </p>
                    <span className="text-foreground font-medium tabular-nums">
                      {entry.hire_count}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      / {entry.monthly_goal}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Si no está en top 10 */}
          {myLabel && !isInTop10 && myIndex >= 0 && (
            <p className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
              {t('gamification_leaderboard_you_position', {
                position: myIndex + 1,
                total: sorted.length,
              })}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}

// src/components/portal/insights/PendingActions.tsx
// Pendientes accionables del día: 3 grupos (urgent / followup / no_contact).

import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Phone, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PendingBlob, PendingItem } from '@/lib/api';

interface Props {
  data: PendingBlob | null | undefined;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hoursSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  const ms = Date.now() - t;
  return Math.max(0, Math.round(ms / (1000 * 60 * 60)));
}

function hoursUntil(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  const ms = t - Date.now();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60)));
}

function statusPillClass(status: PendingItem['status']): string {
  switch (status) {
    case 'elite':
      return 'bg-success/15 text-success border-success/30';
    case 'calificado':
      return 'bg-primary/15 text-primary border-primary/30';
    case 'potencial':
      return 'bg-warning/15 text-warning border-warning/30';
    case 'descartado':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    default:
      return 'bg-muted/30 text-muted-foreground border-border';
  }
}

function scoreColorClass(score: number): string {
  if (score >= 110) return 'text-success';
  if (score >= 90) return 'text-primary';
  if (score >= 80) return 'text-warning';
  return 'text-muted-foreground';
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────

function PendingRow({
  item,
  meta,
}: {
  item: PendingItem;
  meta: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/20 transition-colors">
      <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
        {item.name}
      </span>
      <span className={`text-xs font-bold ${scoreColorClass(item.score_total)}`}>
        {item.score_total} pts
      </span>
      <span
        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusPillClass(
          item.status,
        )}`}
      >
        {item.status}
      </span>
      <span className="text-xs text-muted-foreground flex-1 min-w-[120px]">
        {meta}
      </span>
      <a
        href={`tel:${item.phone}`}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Phone className="w-3 h-3" />
        {item.phone}
      </a>
    </div>
  );
}

function Group({
  emoji,
  title,
  items,
  renderMeta,
  defaultOpen,
}: {
  emoji: string;
  title: string;
  items: PendingItem[];
  renderMeta: (item: PendingItem) => ReactNode;
  defaultOpen: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/20 hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span>{emoji}</span>
          <span>{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
            {items.length}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/40">
              {items.length === 0 ? (
                <p className="px-3 py-3 text-xs text-muted-foreground">
                  {t('insights_pending_empty')} ✓
                </p>
              ) : (
                items.map(item => (
                  <PendingRow key={item.id} item={item} meta={renderMeta(item)} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function PendingActions({ data }: Props) {
  const { t } = useLanguage();

  const urgent = data?.urgent ?? [];
  const followup = data?.followup ?? [];
  const noContact = data?.no_contact ?? [];
  const totalPending = urgent.length + followup.length + noContact.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertTriangle className="w-4 h-4 text-warning" />
          {t('insights_pending_title')}
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${
            totalPending > 0
              ? 'bg-warning/15 text-warning border-warning/30'
              : 'bg-muted/30 text-muted-foreground border-border'
          }`}
        >
          {totalPending}
        </span>
      </div>

      <div className="space-y-2">
        <Group
          emoji="🔥"
          title={t('insights_pending_urgent')}
          items={urgent}
          defaultOpen={urgent.length > 0}
          renderMeta={(item) =>
            t('insights_pending_assigned_ago', { hours: hoursSince(item.created_at) })
          }
        />
        <Group
          emoji="⏰"
          title={t('insights_pending_followup')}
          items={followup}
          defaultOpen={followup.length > 0 && urgent.length === 0}
          renderMeta={(item) => {
            if (!item.interview_date) return '';
            const when = new Date(item.interview_date);
            const fmt = !Number.isNaN(when.getTime())
              ? when.toLocaleString(undefined, {
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';
            return `${fmt} · ${t('insights_pending_in_hours', {
              hours: hoursUntil(item.interview_date),
            })}`;
          }}
        />
        <Group
          emoji="📞"
          title={t('insights_pending_no_contact')}
          items={noContact}
          defaultOpen={false}
          renderMeta={(item) => (
            <span className="inline-flex items-center gap-1">
              <Clock className="inline w-3 h-3 align-text-bottom" />
              {t('insights_pending_received_ago', { hours: hoursSince(item.created_at) })}
            </span>
          )}
        />
      </div>
    </motion.div>
  );
}

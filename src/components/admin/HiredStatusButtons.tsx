// src/components/admin/HiredStatusButtons.tsx
// Botones para marcar el resultado de la entrevista: contratado / declinado / no asistió.
// Llama PATCH /api/hr/evaluations/:id/hired-status al hacer clic.

import { useState } from 'react';
import { Check, X, MinusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useUpdateHiredStatus } from '@/hooks/useAdmin';

type HiredStatus = 'hired' | 'declined' | 'no_show' | null;

interface HiredStatusButtonsProps {
  evaluationId: string;
  currentStatus: HiredStatus;
  onStatusChange: (status: HiredStatus, notes: string | null) => void;
}

const STATUS_CONFIG = {
  hired: {
    label: 'Contratado',
    icon: Check,
    activeClass: 'bg-success/20 text-success border-success/50 hover:bg-success/30',
    inactiveClass: 'bg-muted/20 text-muted-foreground border-border hover:border-success/40 hover:text-success',
  },
  declined: {
    label: 'Declinado',
    icon: X,
    activeClass: 'bg-destructive/20 text-destructive border-destructive/50 hover:bg-destructive/30',
    inactiveClass: 'bg-muted/20 text-muted-foreground border-border hover:border-destructive/40 hover:text-destructive',
  },
  no_show: {
    label: 'No asistió',
    icon: MinusCircle,
    activeClass: 'bg-warning/20 text-warning border-warning/50 hover:bg-warning/30',
    inactiveClass: 'bg-muted/20 text-muted-foreground border-border hover:border-warning/40 hover:text-warning',
  },
} as const;

export function HiredStatusButtons({
  evaluationId,
  currentStatus,
  onStatusChange,
}: HiredStatusButtonsProps) {
  const { update, loading } = useUpdateHiredStatus();
  const [notes, setNotes] = useState('');
  const [pendingStatus, setPendingStatus] = useState<HiredStatus>(null);

  const handleClick = async (status: HiredStatus) => {
    // Toggle: clicking the same status clears it
    const newStatus = currentStatus === status ? null : status;
    setPendingStatus(newStatus);

    const success = await update(evaluationId, newStatus, notes || null);
    setPendingStatus(null);

    if (success) {
      onStatusChange(newStatus, notes || null);
      const label = newStatus ? STATUS_CONFIG[newStatus].label : 'Borrado';
      toast.success(`Estado actualizado: ${label}`);
    } else {
      toast.error('No se pudo actualizar el estado. Intenta de nuevo.');
    }
  };

  const handleNotesBlur = async () => {
    if (!currentStatus) return;
    const success = await update(evaluationId, currentStatus, notes || null);
    if (success) {
      onStatusChange(currentStatus, notes || null);
      toast.success('Notas guardadas');
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-foreground font-semibold text-sm uppercase tracking-wider">
        Resultado de entrevista
      </h4>

      {/* Status buttons */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(status => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          const isActive = currentStatus === status;
          const isLoading = loading && pendingStatus === status;

          return (
            <motion.button
              key={status}
              onClick={() => handleClick(status)}
              disabled={loading}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60 ${
                isActive ? cfg.activeClass : cfg.inactiveClass
              }`}
            >
              {isLoading ? (
                <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon size={13} />
              )}
              {cfg.label}
              {isActive && (
                <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Notes input */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Notas internas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Observaciones del resultado de la entrevista..."
          rows={3}
          className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
        />
      </div>
    </div>
  );
}

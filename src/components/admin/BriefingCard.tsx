// src/components/admin/BriefingCard.tsx
// Tarjeta de briefing de Claude Sonnet para un candidato.
// Muestra summary, preguntas sugeridas y green/red flags.

import { RefreshCw, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BriefingFlags {
  green: string[];
  red: string[];
}

interface BriefingCardProps {
  /** Si existe, muestra el briefing. Si null, muestra el botón de generar. */
  summary: string | null;
  questions: string[] | null;
  flags: BriefingFlags | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  /** Si false, oculta el botón de regenerar (ej. portal recruiter sin permisos). */
  canGenerate?: boolean;
}

export function BriefingCard({
  summary,
  questions,
  flags,
  generating,
  error,
  onGenerate,
  canGenerate = true,
}: BriefingCardProps) {
  const hasBriefing = !!summary;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Briefing — Claude Sonnet
          </span>
        </div>
        {canGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2.5 py-1 rounded-lg hover:bg-primary/10 disabled:opacity-50"
          >
            <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
            {hasBriefing ? 'Regenerar' : 'Generar briefing'}
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Error */}
        {error && (
          <p className="text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Loading skeleton */}
        {generating && !summary && (
          <div className="space-y-2">
            {[100, 80, 90].map((w, i) => (
              <div key={i} className={`h-3 bg-muted/40 rounded animate-pulse`} style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {/* No briefing yet */}
        {!hasBriefing && !generating && !error && (
          <div className="flex flex-col items-center gap-2 py-4">
            <HelpCircle size={28} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Briefing no generado aún.</p>
            {canGenerate && (
              <button
                onClick={onGenerate}
                disabled={generating}
                className="shimmer-btn gold-gradient text-primary-foreground font-semibold px-5 py-2 rounded-full text-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              >
                Generar briefing con IA
              </button>
            )}
          </div>
        )}

        {/* Briefing content */}
        {hasBriefing && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Summary */}
            <p className="text-foreground text-sm leading-relaxed italic">
              "{summary}"
            </p>

            {/* Suggested questions */}
            {questions && questions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                  Preguntas sugeridas para la entrevista:
                </p>
                <ol className="space-y-1.5 list-none">
                  {questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Green / Red flags */}
            {flags && (flags.green.length > 0 || flags.red.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {/* Green */}
                {flags.green.length > 0 && (
                  <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={13} className="text-success" />
                      <span className="text-xs font-semibold text-success uppercase tracking-wider">Fortalezas</span>
                    </div>
                    <ul className="space-y-1">
                      {flags.green.map((f, i) => (
                        <li key={i} className="text-xs text-foreground flex items-start gap-1">
                          <span className="text-success mt-0.5">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red */}
                {flags.red.length > 0 && (
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <XCircle size={13} className="text-destructive" />
                      <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Riesgos</span>
                    </div>
                    <ul className="space-y-1">
                      {flags.red.map((f, i) => (
                        <li key={i} className="text-xs text-foreground flex items-start gap-1">
                          <span className="text-destructive mt-0.5">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

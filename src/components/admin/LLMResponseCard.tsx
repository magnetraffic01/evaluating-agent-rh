// src/components/admin/LLMResponseCard.tsx
// Muestra una respuesta LLM-evaluada de un candidato (reactivación, objeción, autonomía).
// Incluye la respuesta del candidato, el score y el reasoning de Claude si existe.

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MAX_CHARS = 300;

interface LLMResponseCardProps {
  icon: string;
  label: string;
  score: number;
  maxScore: number;
  response: string | null | undefined;
  reasoning: string | null | undefined;
  /** fallback highlight if no reasoning */
  highlight?: string | null;
}

export function LLMResponseCard({
  icon,
  label,
  score,
  maxScore,
  response,
  reasoning,
  highlight,
}: LLMResponseCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!response && !reasoning) return null;

  const scorePct = Math.max(0, Math.min(100, (score / maxScore) * 100));
  const scoreColor =
    scorePct >= 70 ? 'text-success' :
    scorePct >= 40 ? 'text-warning' :
    'text-destructive';

  const barColor =
    scorePct >= 70 ? 'bg-success' :
    scorePct >= 40 ? 'bg-warning' :
    'bg-destructive';

  const truncated = response && response.length > MAX_CHARS;
  const displayText = response
    ? (truncated && !expanded ? response.slice(0, MAX_CHARS) + '…' : response)
    : null;

  const activeReasoning = reasoning || highlight;

  return (
    <div className="rounded-xl bg-muted/10 border border-border/40 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${scoreColor}`}>
            {score}/{maxScore}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${scorePct}%` }}
        />
      </div>

      {/* Candidate response */}
      {displayText && (
        <div>
          <p className="text-foreground text-sm leading-relaxed">
            "{displayText}"
          </p>
          {truncated && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              {expanded ? (
                <><ChevronUp size={12} />Ver menos</>
              ) : (
                <><ChevronDown size={12} />Ver más</>
              )}
            </button>
          )}
        </div>
      )}

      {/* LLM Reasoning */}
      {activeReasoning && (
        <div className="flex items-start gap-2 border-l-2 border-primary/40 pl-3">
          <span className="text-muted-foreground/70 text-xs mt-0.5">Claude:</span>
          <p className="text-muted-foreground text-xs leading-relaxed italic flex-1">
            "{activeReasoning}"
          </p>
        </div>
      )}
    </div>
  );
}

// src/components/admin/CompaniesPanel.tsx
// Phase 5 — company quota distribution UI

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanies, useUpdateCompany, type Company } from '@/hooks/useAdmin';

// ─── Local draft shape ────────────────────────────────────────────────────────

interface CompanyDraft {
  target_percent: number;
  active: boolean;
}

// ─── Single company row ───────────────────────────────────────────────────────

function CompanyRow({
  company,
  draft,
  onChangePct,
  onToggleActive,
  disabled,
}: {
  company: Company;
  draft: CompanyDraft;
  onChangePct: (v: number) => void;
  onToggleActive: () => void;
  disabled: boolean;
}) {
  const isInactive = !draft.active;
  const deficit = draft.target_percent - company.actual_percent;

  return (
    <div
      className={`glass-card rounded-xl p-5 space-y-4 transition-opacity ${isInactive ? 'opacity-60' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-foreground font-semibold text-base">{company.name}</h3>
            {company.notes && (
              <p className="text-muted-foreground text-xs truncate max-w-[260px]">{company.notes}</p>
            )}
          </div>
        </div>

        {/* Active toggle */}
        <button
          onClick={onToggleActive}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            draft.active
              ? 'bg-success/15 text-success border-success/40 hover:bg-success/25'
              : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${draft.active ? 'bg-success' : 'bg-muted-foreground'}`}
          />
          {draft.active ? 'ACTIVA' : 'INACTIVA'}
        </button>
      </div>

      {/* Actual vs target */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex-1">
          {/* Bar: actual fill + target marker */}
          <div className="relative h-2.5 bg-muted/40 rounded-full overflow-hidden">
            {/* actual */}
            <div
              className={`h-full rounded-full transition-all ${
                company.actual_percent > draft.target_percent ? 'bg-warning' : 'bg-primary/60'
              }`}
              style={{ width: `${Math.min(company.actual_percent, 100)}%` }}
            />
            {/* target marker */}
            {draft.target_percent > 0 && (
              <div
                className="absolute top-0 h-full w-0.5 bg-primary"
                style={{ left: `${Math.min(draft.target_percent, 100)}%` }}
                title={`Objetivo: ${draft.target_percent}%`}
              />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            {company.total_assigned} leads asignados &middot; {company.actual_percent}% real vs {draft.target_percent}% objetivo
            {deficit !== 0 && (
              <span className={deficit > 0 ? ' text-warning' : ' text-success'}>
                {' '}({deficit > 0 ? `+${deficit}` : deficit}% desvío)
              </span>
            )}
          </p>
        </div>

        {/* Pct badge */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-muted-foreground text-xs">{company.actual_percent}% / </span>
          <span className="text-primary font-semibold">{draft.target_percent}%</span>
        </div>
      </div>

      {/* Slider + numeric input */}
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={draft.target_percent}
          disabled={isInactive || disabled}
          onChange={e => onChangePct(Number(e.target.value))}
          className="flex-1 accent-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={draft.target_percent}
          disabled={isInactive || disabled}
          onChange={e => {
            const v = Math.max(0, Math.min(100, Number(e.target.value)));
            onChangePct(v);
          }}
          className="w-16 bg-input border border-border rounded-lg px-2 py-1 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40"
        />
        <span className="text-muted-foreground text-sm">%</span>
      </div>
    </div>
  );
}

// ─── CompaniesPanel ───────────────────────────────────────────────────────────

export function CompaniesPanel() {
  const { companies, loading, error, refetch } = useCompanies();
  const { update, loading: saving } = useUpdateCompany();

  // Local draft state: code → draft
  const [drafts, setDrafts] = useState<Record<string, CompanyDraft>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  // Seed drafts when companies load (or reload)
  useEffect(() => {
    if (!companies.length) return;
    setDrafts(
      Object.fromEntries(
        companies.map(c => [c.code, { target_percent: c.target_percent, active: c.active }])
      )
    );
    setDirty(new Set());
  }, [companies]);

  const setDraft = (code: string, patch: Partial<CompanyDraft>) => {
    setDrafts(prev => ({ ...prev, [code]: { ...prev[code], ...patch } }));
    setDirty(prev => new Set(prev).add(code));
  };

  // Validation: active companies must sum to 100
  const activeSum = Object.entries(drafts)
    .filter(([, d]) => d.active)
    .reduce((s, [, d]) => s + d.target_percent, 0);

  const isValid = activeSum === 100;

  const handleSave = async () => {
    if (!isValid) {
      toast.error('La suma de empresas activas debe ser exactamente 100%.');
      return;
    }
    const toSave = Array.from(dirty);
    if (!toSave.length) {
      toast('Sin cambios para guardar.');
      return;
    }
    let allOk = true;
    for (const code of toSave) {
      const d = drafts[code];
      if (!d) continue;
      const ok = await update(code, { target_percent: d.target_percent, active: d.active });
      if (!ok) allOk = false;
    }
    if (allOk) {
      toast.success('Cambios guardados correctamente.');
      setDirty(new Set());
      refetch();
    } else {
      toast.error('Hubo un error guardando algunos cambios.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
        <AlertCircle size={16} />
        {error}
        <button onClick={refetch} className="ml-auto underline hover:no-underline">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground font-semibold text-base uppercase tracking-wider">
          Distribución por Empresa
        </h2>
        {/* Active sum indicator */}
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full border ${
            isValid
              ? 'bg-success/15 text-success border-success/40'
              : 'bg-warning/15 text-warning border-warning/40'
          }`}
        >
          Total activas: {activeSum}%
        </span>
      </div>

      {/* Company rows */}
      {companies.map(company => {
        const draft = drafts[company.code];
        if (!draft) return null;
        return (
          <CompanyRow
            key={company.code}
            company={company}
            draft={draft}
            disabled={saving}
            onChangePct={v => setDraft(company.code, { target_percent: v })}
            onToggleActive={() => setDraft(company.code, { active: !draft.active })}
          />
        );
      })}

      {/* Warning if not 100 */}
      {!isValid && (
        <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 text-sm text-warning">
          <AlertCircle size={15} />
          La suma de las empresas activas debe ser exactamente 100%. Actualmente: {activeSum}%.
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !dirty.size}
          className="shimmer-btn gold-gradient text-primary-foreground font-semibold px-6 py-2.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {dirty.size > 0 && !saving && (
          <span className="text-xs text-muted-foreground">{dirty.size} empresa(s) con cambios sin guardar</span>
        )}
      </div>
    </div>
  );
}

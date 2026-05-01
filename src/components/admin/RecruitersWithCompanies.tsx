// src/components/admin/RecruitersWithCompanies.tsx
// Phase 5 — company toggles inside the recruiter list

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  recruiters as apiRecruiters,
  recruiterCompanies as apiRecruiterCompanies,
  ApiError,
  type RecruiterFull,
  type RecruiterCompanyLink,
} from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBool(v: boolean | number | undefined | null): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number')  return v === 1;
  return false;
}

function getCompanyLink(companies: RecruiterCompanyLink[] | undefined, code: string): RecruiterCompanyLink | undefined {
  return companies?.find(c => c.company === code);
}

// Known company codes — extend when more companies are added in the future.
const KNOWN_COMPANIES: { code: string; label: string }[] = [
  { code: 'trebolife', label: 'Trebolife' },
  { code: 'traduce',   label: 'Traduce'   },
];

// ─── Company toggle chip ──────────────────────────────────────────────────────

function CompanyToggle({
  recruiter,
  companyCode,
  companyLabel,
  active,
  totalAssigned,
  onToggle,
  disabled,
}: {
  recruiter: RecruiterFull;
  companyCode: string;
  companyLabel: string;
  active: boolean;
  totalAssigned: number;
  onToggle: (recruiterId: string, companyCode: string, newActive: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        disabled={disabled}
        onClick={() => onToggle(recruiter.id, companyCode, !active)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          active
            ? 'bg-success/15 text-success border-success/40 hover:bg-success/25'
            : 'bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
        }`}
        title={`${active ? 'Desactivar' : 'Activar'} ${companyLabel} para ${recruiter.name}`}
      >
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${active ? 'bg-success' : 'bg-muted-foreground'}`} />
        {companyLabel}
      </button>
      <span className="text-[10px] text-muted-foreground/60">{totalAssigned} lleva</span>
    </div>
  );
}

// ─── Recruiter card ───────────────────────────────────────────────────────────

function RecruiterCard({
  recruiter,
  onToggleCompany,
  toggling,
}: {
  recruiter: RecruiterFull;
  onToggleCompany: (recruiterId: string, companyCode: string, newActive: boolean) => void;
  toggling: string | null; // `${recruiterId}:${companyCode}`
}) {
  const isActive = toBool(recruiter.active);

  return (
    <div className={`glass-card rounded-xl p-4 space-y-3 transition-opacity ${isActive ? '' : 'opacity-60'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-foreground font-medium text-sm">{recruiter.name}</span>
            <span className="text-muted-foreground text-xs">{recruiter.label}</span>
            <span className="text-muted-foreground text-xs">&middot; peso {recruiter.weight}</span>
            <span className="text-muted-foreground text-xs">&middot; {recruiter.total_assigned} asignados</span>
          </div>
          {recruiter.calendar_url && (
            <p className="text-muted-foreground/50 text-[11px] truncate mt-0.5 max-w-[320px]">
              {recruiter.calendar_url.replace(/^https?:\/\//, '')}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            isActive
              ? 'bg-success/15 text-success border-success/40'
              : 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Company toggles */}
      <div>
        <p className="text-muted-foreground text-xs mb-2">Empresas:</p>
        <div className="flex items-start gap-3 flex-wrap">
          {KNOWN_COMPANIES.map(({ code, label }) => {
            const link = getCompanyLink(recruiter.companies, code);
            const active = link ? toBool(link.active) : false;
            const totalAssigned = link?.total_assigned ?? 0;
            const isToggling = toggling === `${recruiter.id}:${code}`;
            return (
              <CompanyToggle
                key={code}
                recruiter={recruiter}
                companyCode={code}
                companyLabel={label}
                active={active}
                totalAssigned={totalAssigned}
                onToggle={onToggleCompany}
                disabled={isToggling}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── RecruitersWithCompanies ──────────────────────────────────────────────────

export function RecruitersWithCompanies() {
  const [recruiters, setRecruiters] = useState<RecruiterFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // tracks which toggle is in-flight as `"recruiterId:companyCode"`
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchRecruiters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRecruiters.list();
      const rows = (res.rows ?? []) as RecruiterFull[];
      setRecruiters(rows.sort((a, b) => a.label.localeCompare(b.label)));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecruiters(); }, [fetchRecruiters]);

  const handleToggleCompany = useCallback(async (
    recruiterId: string,
    companyCode: string,
    newActive: boolean,
  ) => {
    const key = `${recruiterId}:${companyCode}`;
    setToggling(key);
    try {
      await apiRecruiterCompanies.setActive(recruiterId, { [companyCode]: newActive });

      // Optimistic update
      setRecruiters(prev => prev.map(r => {
        if (r.id !== recruiterId) return r;
        const existingCompanies = r.companies ?? [];
        const hasEntry = existingCompanies.some(c => c.company === companyCode);
        const updatedCompanies = hasEntry
          ? existingCompanies.map(c => c.company === companyCode ? { ...c, active: newActive } : c)
          : [...existingCompanies, { company: companyCode, active: newActive, total_assigned: 0 }];
        return { ...r, companies: updatedCompanies };
      }));

      // Find recruiter name for toast
      const rec = recruiters.find(r => r.id === recruiterId);
      const companyLabel = KNOWN_COMPANIES.find(c => c.code === companyCode)?.label ?? companyCode;
      const action = newActive ? 'activada' : 'desactivada';
      toast.success(`${companyLabel} ${action} para ${rec?.name ?? 'reclutador'}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : String(e));
      toast.error(`Error al actualizar: ${msg}`);
    } finally {
      setToggling(null);
    }
  }, [recruiters]);

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
        <button onClick={fetchRecruiters} className="ml-auto underline hover:no-underline">Reintentar</button>
      </div>
    );
  }

  if (!recruiters.length) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No hay reclutadores configurados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recruiters.map(r => (
        <RecruiterCard
          key={r.id}
          recruiter={r}
          onToggleCompany={handleToggleCompany}
          toggling={toggling}
        />
      ))}
    </div>
  );
}

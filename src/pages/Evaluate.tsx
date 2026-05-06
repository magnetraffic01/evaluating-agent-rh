import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import MagnetLogo from '@/components/MagnetLogo';
import WavingHand from '@/components/WavingHand';
import StepRenderer from '@/components/StepRenderer';
import {
  EvaluationState, Company, createInitialState,
  getSkippedSteps, getTotalVisibleSteps,
} from '@/types/evaluation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  scoreClosingRole, isClosingRoleDisqualify, scoreVolume,
  scoreIncomePenalty,
  scoreReactivationAsync, scoreObjectionAsync, scoreAutonomyAsync,
  scorePhilosophy, philosophyPenalty,
  scoreStability, scoreRampUp, calculateTotalScore, calculateFinalStatus,
} from '@/utils/scoring';
import { syncToBackend, completeInBackend } from '@/hooks/useSession';
import { sendWebhook } from '@/lib/webhook';
import { assignRecruiter } from '@/lib/recruiters';
import { useStepTracking } from '@/hooks/useStepTracking';
import { API_BASE_URL } from '@/lib/api';

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutos

// Helper: avanza desde `from` saltando los steps no aplicables a la empresa.
function nextApplicableStep(from: number, company: Company): number {
  const skipped = getSkippedSteps(company);
  let n = from;
  while (skipped.has(n)) n++;
  return n;
}

// ─── localStorage helpers (cache local) ──────────────────────────────────────

function saveLocal(state: EvaluationState) {
  localStorage.setItem(`eval_${state.sessionId}`, JSON.stringify(state));
}

function saveCompleted(state: EvaluationState) {
  const list = JSON.parse(localStorage.getItem('completedEvaluations') || '[]');
  // Evitar duplicados por sessionId
  const deduped = list.filter((s: EvaluationState) => s.sessionId !== state.sessionId);
  deduped.push(state);
  localStorage.setItem('completedEvaluations', JSON.stringify(deduped));
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Evaluate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const name = searchParams.get('name') || '';
  const phone = searchParams.get('phone') || '';
  const recruiter = searchParams.get('recruiter') || '';
  const companyParam = (searchParams.get('company') || '').toLowerCase();
  const company: Company =
    companyParam === 'trebolife' || companyParam === 'traduce' ? companyParam : null;

  const { t, lang } = useLanguage();
  const [state, setState] = useState<EvaluationState | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Lock síncrono para evitar dobles clicks. setState es asíncrono y la UI
  // puede disparar 2 handleNext o handleDisqualify antes de que el state se
  // actualice. useRef.current es leído inmediatamente.
  const handlerLockRef = useRef(false);
  const { startStep, endStepAndReport } = useStepTracking();

  // Anti-retroceso del navegador
  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Step timer — arranca cuando cambia el step actual
  useEffect(() => {
    if (!state || showWelcome) return;
    startStep(state.currentStep);
  }, [state?.currentStep, showWelcome]);

  // Inicialización de sesión
  useEffect(() => {
    if (!name || !phone) return;
    let cancelled = false;

    (async () => {
      const sessionKey = `eval_session_${phone}`;
      const existingSessionId = localStorage.getItem(sessionKey);

      if (existingSessionId) {
        const saved = localStorage.getItem(`eval_${existingSessionId}`);
        if (saved) {
          const parsed = JSON.parse(saved) as EvaluationState;
          const elapsed = Date.now() - new Date(parsed.startTime).getTime();
          if (elapsed < SESSION_TIMEOUT_MS && parsed.status === 'en_progreso') {
            setState(parsed);
            setShowWelcome(false);
            syncToBackend(parsed);
            return;
          } else if (elapsed >= SESSION_TIMEOUT_MS && parsed.status === 'en_progreso') {
            navigate('/expired');
            return;
          }
        }
      }

      // Sesión nueva. Si NO viene company en la URL, decidirla server-side
      // según las cuotas configuradas (FASE 5). Si viene en URL, respetar.
      let resolvedCompany: Company = company;
      if (!resolvedCompany) {
        try {
          const decided = await fetch(`${API_BASE_URL}/api/hr/companies/decide`, { method: 'POST' });
          if (decided.ok) {
            const data = await decided.json();
            if (data?.company === 'trebolife' || data?.company === 'traduce') {
              resolvedCompany = data.company;
            }
          }
        } catch (_e) {
          // Sin decide → cae al flujo legacy (sin company)
        }
      }
      if (cancelled) return;

      const initial = createInitialState(name, phone, resolvedCompany);
      if (recruiter) initial.assignedTo = recruiter;
      localStorage.setItem(sessionKey, initial.sessionId);
      saveLocal(initial);
      setState(initial);
      // Trebolife (y Traduce cuando se configure) saltan el welcome screen.
      if (resolvedCompany === 'trebolife' || resolvedCompany === 'traduce') {
        setShowWelcome(false);
      }
      syncToBackend(initial);
    })();

    return () => { cancelled = true; };
  }, [name, phone, company, recruiter, navigate]);

  const handleStart = () => {
    setShowWelcome(false);
  };

  // ─── Descarte ───────────────────────────────────────────────────────────────

  const handleDisqualify = useCallback(async (reason: string) => {
    if (!state) return;
    // Bug fix: guard contra doble click — si nadie tomó el lock aún, lo tomamos.
    // Si handleNext ya lo tomó (descalificación durante el flow), seguimos
    // adelante sin re-bloquear.
    if (!handlerLockRef.current) {
      handlerLockRef.current = true;
      setIsSaving(true);
    }

    const updated: EvaluationState = {
      ...state,
      disqualifyReason: reason,
      status: 'descartado',
      completedAt: new Date().toISOString(),
    };
    updated.totalScore = calculateTotalScore(updated);

    saveLocal(updated);
    saveCompleted(updated);

    const { error } = await completeInBackend(updated);
    if (error) {
      toast.error('Error al guardar. Continuando de todas formas...', {
        action: { label: 'OK', onClick: () => {} },
      });
    }

    // Notificar a GoHighLevel (fire and forget)
    sendWebhook(updated);

    endStepAndReport(state.currentStep, state.sessionId);
    handlerLockRef.current = false;
    setIsSaving(false);
    navigate(`/result/${updated.sessionId}`);
  }, [state, navigate, endStepAndReport]);

  // ─── Avanzar paso ───────────────────────────────────────────────────────────

  const handleNext = useCallback(async (data: Record<string, any>) => {
    // Bug fix: lock síncrono con useRef. Sin esto el usuario podía
    // disparar 2 handleNext concurrentes durante los await LLM (~8s),
    // generando race condition con scores incorrectos.
    if (!state || handlerLockRef.current) return;
    handlerLockRef.current = true;
    setIsSaving(true);

    let updated = { ...state, ...data };
    const step = state.currentStep;

    // Scoring por step
    switch (step) {
      case 0: // Consent
        updated.flags = { ...updated.flags, consintio_proceso: true };
        break;

      case 3: { // Closing role + volume
        if (isClosingRoleDisqualify(data.closingRole)) {
          handleDisqualify('sin_cierre_directo');
          return;
        }
        const roleScore = scoreClosingRole(data.closingRole);
        const volResult = scoreVolume(data.closingVolume);
        updated.scores = { ...updated.scores, E1_cierre: roleScore, E1_volumen: volResult.score };
        updated.dailyCalls = volResult.dailyCalls;
        break;
      }

      case 4: { // Income
        const penalty = scoreIncomePenalty(data.lastIncome, data.exitReason);
        updated.scores = { ...updated.scores, E2_penalty: penalty };
        break;
      }

      case 5: { // Reactivation (LLM-scored)
        const result = await scoreReactivationAsync(data.reactivationMsg);
        updated.scores = { ...updated.scores, E3_copywriting: result.score };
        if (result.disqualify) {
          handleDisqualify('sin_copywriting');
          return;
        }
        updated.highlight = data.reactivationMsg;
        break;
      }

      case 6: { // Objection (LLM-scored)
        const result = await scoreObjectionAsync(data.objectionResponse);
        updated.scores = { ...updated.scores, E4_objeciones: result.score };
        if (result.disqualify) {
          handleDisqualify('sin_objeciones');
          return;
        }
        break;
      }

      case 7: { // Autonomy (LLM-scored)
        const result = await scoreAutonomyAsync(data.autonomyDesc);
        updated.scores = { ...updated.scores, E5_autonomia: result.score };
        updated.flags = { ...updated.flags, baja_ejecucion: result.bajaEjecucion };
        break;
      }

      case 8: { // Philosophy (legacy) | InboundOpen (trebolife/traduce, FASE 10)
        if (state.company === 'trebolife' || state.company === 'traduce') {
          // InboundOpen es texto libre — se guarda sin scoring automático.
          // (Pendiente: scoring LLM en fase futura si valida señal.)
          break;
        }
        const score = scorePhilosophy(data.philosophy, data.philosophyExplanation);
        const penalty = philosophyPenalty(data.philosophy, data.philosophyExplanation);
        updated.scores = { ...updated.scores, E6_filosofia: score };
        if (penalty < 0) {
          updated.scores = { ...updated.scores, V1_penalty: updated.scores.V1_penalty + penalty };
        }
        break;
      }

      case 9: { // Verification trap
        if (data.verificationAnswer === 'incorrect') {
          updated.flags = { ...updated.flags, narrativa_inconsistente: true, b_verif_aplicada: true };
          updated.scores = { ...updated.scores, V1_penalty: updated.scores.V1_penalty - 10 };
        }
        break;
      }

      case 10: { // Stability
        const result = scoreStability(data.jobCount);
        updated.scores = { ...updated.scores, C1_estabilidad: result.score };
        updated.flags = { ...updated.flags, riesgo_retencion: result.riesgoRetencion };
        break;
      }

      case 11: { // Financial (legacy) | Stability + Ramp-up (Trebolife/Traduce, FASE 10)
        if (state.company === 'trebolife' || state.company === 'traduce') {
          // FASE 10: el step combina financialSituation + rampUpExpectation.
          // financialSituation === 'needs_now' descalifica desde el step component.
          // Acá solo scoreamos el ramp-up.
          const result = scoreRampUp(data.rampUpExpectation);
          updated.scores = { ...updated.scores, Ramp1_velocidad: result.score };
          if (result.disqualify) {
            handleDisqualify('sin_ramp_up');
            return;
          }
        } else {
          // Legacy financial flow ya descalifica vía onDisqualify desde el step component.
        }
        break;
      }

      case 12: { // PreReg (legacy) | ChurnResistance (Trebolife)
        // ChurnResistance es texto libre; se guarda en answers para que la
        // reclutadora lo vea, pero no genera score automático en esta fase.
        // (Pendiente: scoring LLM en Fase 2.D si se valida que aporta señal.)
        break;
      }

      case 13: { // CV — paso final
        setIsSaving(true);
        updated.totalScore = calculateTotalScore(updated);
        updated.status = calculateFinalStatus(updated);
        updated.completedAt = new Date().toISOString();

        // Asignar reclutador si calificó (eliminada categoría "potencial" — ya no llega aquí)
        // Pasamos company para que el round-robin filtre por reclutadores que la atienden.
        if (updated.status === 'elite' || updated.status === 'calificado') {
          const assignment = await assignRecruiter(updated.company);
          if (assignment) {
            updated.assignedTo  = assignment.label;
            updated.calendarUrl = assignment.calendar_url;
          }
        }

        saveLocal(updated);
        saveCompleted(updated);

        // Notificar a GoHighLevel (fire and forget — no bloquea el flujo)
        sendWebhook(updated);

        const { error } = await completeInBackend(updated);
        if (error && import.meta.env.DEV) {
          console.warn('[Supabase] Error al guardar evaluación completa:', error);
        }

        // Navegar siempre — el resultado ya está en localStorage
        endStepAndReport(13, state.sessionId);
        handlerLockRef.current = false;
        setIsSaving(false);
        navigate(`/result/${updated.sessionId}`);
        return;
      }
    }

    endStepAndReport(step, state.sessionId);

    // Avanzar al siguiente paso, saltando los no aplicables a la empresa
    updated.currentStep = nextApplicableStep(step + 1, state.company);
    updated.totalScore = calculateTotalScore(updated);
    setState(updated);
    saveLocal(updated);

    // Sync con Supabase en background (no bloquea la UI)
    syncToBackend(updated);

    // Liberar el lock solo después de que el state quedó actualizado.
    handlerLockRef.current = false;
    setIsSaving(false);
  }, [state, navigate, handleDisqualify, endStepAndReport]);

  // ─── Guard: parámetros inválidos ────────────────────────────────────────────

  if (!name || !phone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 max-w-md text-center">
          <MagnetLogo size="lg" />
          <p className="text-destructive mt-6 font-medium">{t('invalid_link')}</p>
        </div>
      </div>
    );
  }

  if (!state) return null;

  // ─── Pantalla de bienvenida ──────────────────────────────────────────────────

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg w-full text-center"
          >
            <div className="flex justify-center mb-6">
              <MagnetLogo size="lg" />
            </div>
            <p className="text-muted-foreground text-sm tracking-widest uppercase mb-6">
              {t('welcome_subtitle')}
            </p>
            <div className="w-16 h-0.5 gold-gradient mx-auto mb-8" />

            <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
              {lang === 'es' ? 'Hola' : 'Hello'}, {name}
              <WavingHand size={34} />
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t('welcome_description')}
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[t('welcome_badge_time'), t('welcome_badge_nopause'), t('welcome_badge_unique')]
                .filter(Boolean)
                .map((badge) => (
                  <span key={badge} className="px-4 py-2 rounded-full border border-primary/30 text-sm text-foreground bg-primary/5">
                    {badge}
                  </span>
                ))}
            </div>

            <button
              onClick={handleStart}
              className="gold-gradient text-primary-foreground font-bold py-4 px-10 rounded-full text-lg transition-all hover:opacity-90 active:scale-[0.98] animate-pulse-gold"
            >
              {t('welcome_start')}
            </button>
          </motion.div>
        </div>
        <footer className="py-4 text-center text-xs text-muted-foreground/50">
          {t('footer_confidential')}
        </footer>
      </div>
    );
  }

  // ─── Flujo de evaluación ─────────────────────────────────────────────────────

  const totalVisibleSteps = getTotalVisibleSteps(state.company);
  // Cuenta cuántos steps NO saltados ya quedaron atrás → posición real en la barra
  const skipped = getSkippedSteps(state.company);
  const visibleStepsBefore = (() => {
    let count = 0;
    for (let s = 0; s < state.currentStep; s++) {
      if (!skipped.has(s)) count++;
    }
    return count;
  })();
  const progressStep = Math.min(visibleStepsBefore + 1, totalVisibleSteps);
  const showProgress = state.currentStep < 13;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <MagnetLogo size="sm" />
          {showProgress && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {t('step_progress', { step: progressStep, total: totalVisibleSteps })}
              </span>
              <div className="w-24 sm:w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gold-gradient rounded-full transition-all duration-500"
                  style={{ width: `${(progressStep / totalVisibleSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <StepRenderer
            step={state.currentStep}
            state={state}
            onNext={handleNext}
            onDisqualify={handleDisqualify}
          />
        </div>
      </main>

      {/* Loader overlay durante steps async (LLM scoring ~8s).
          Da feedback claro al candidato de que su respuesta se está
          analizando — sin esto el botón "Continuar" parece colgado. */}
      {isSaving && (state.currentStep === 5 || state.currentStep === 6 || state.currentStep === 7) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
          <div className="glass-card rounded-xl p-8 max-w-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-foreground font-medium mb-2">{t('llm_analyzing_title')}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('llm_analyzing_subtitle')}</p>
          </div>
        </div>
      )}

      <footer className="py-4 text-center text-xs text-muted-foreground/50">
        {t('footer_confidential')}
      </footer>
    </div>
  );
}

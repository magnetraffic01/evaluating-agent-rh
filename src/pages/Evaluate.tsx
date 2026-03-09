import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import MagnetLogo from '@/components/MagnetLogo';
import WavingHand from '@/components/WavingHand';
import StepRenderer from '@/components/StepRenderer';
import { EvaluationState, createInitialState } from '@/types/evaluation';
import {
  scoreClosingRole, isClosingRoleDisqualify, scoreVolume,
  scoreIncomePenalty, scoreReactivation, scoreObjection,
  scoreAutonomy, scorePhilosophy, philosophyPenalty,
  scoreStability, calculateTotalScore, calculateFinalStatus,
} from '@/utils/scoring';
import { syncToSupabase, completeInSupabase } from '@/hooks/useSession';
import { sendWebhook } from '@/lib/webhook';

const TOTAL_VISIBLE_STEPS = 12;
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutos

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

  const [state, setState] = useState<EvaluationState | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Anti-retroceso del navegador
  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Inicialización de sesión
  useEffect(() => {
    if (!name || !phone) return;

    const sessionKey = `eval_session_${phone}`;
    const existingSessionId = localStorage.getItem(sessionKey);

    if (existingSessionId) {
      const saved = localStorage.getItem(`eval_${existingSessionId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as EvaluationState;
        const elapsed = Date.now() - new Date(parsed.startTime).getTime();
        if (elapsed < SESSION_TIMEOUT_MS && parsed.status === 'en_progreso') {
          // Sesión válida — reanudar
          setState(parsed);
          setShowWelcome(false);
          // Sincronizar actividad con Supabase en background
          syncToSupabase(parsed);
          return;
        } else if (elapsed >= SESSION_TIMEOUT_MS && parsed.status === 'en_progreso') {
          // Sesión expirada
          navigate('/expired');
          return;
        }
      }
    }

    // Sesión nueva
    const initial = createInitialState(name, phone);
    localStorage.setItem(sessionKey, initial.sessionId);
    saveLocal(initial);
    setState(initial);
    // Crear registro en Supabase (fire and forget)
    syncToSupabase(initial);
  }, [name, phone, navigate]);

  const handleStart = () => {
    setShowWelcome(false);
  };

  // ─── Descarte ───────────────────────────────────────────────────────────────

  const handleDisqualify = useCallback(async (reason: string) => {
    if (!state) return;
    setIsSaving(true);

    const updated: EvaluationState = {
      ...state,
      disqualifyReason: reason,
      status: 'descartado',
      completedAt: new Date().toISOString(),
    };
    updated.totalScore = calculateTotalScore(updated);

    saveLocal(updated);
    saveCompleted(updated);

    const { error } = await completeInSupabase(updated);
    if (error) {
      toast.error('Error al guardar. Continuando de todas formas...', {
        action: { label: 'OK', onClick: () => {} },
      });
    }

    // Notificar a GoHighLevel (fire and forget)
    sendWebhook(updated);

    setIsSaving(false);
    navigate(`/result/${updated.sessionId}`);
  }, [state, navigate]);

  // ─── Avanzar paso ───────────────────────────────────────────────────────────

  const handleNext = useCallback(async (data: Record<string, any>) => {
    if (!state || isSaving) return;

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

      case 5: { // Reactivation
        const result = scoreReactivation(data.reactivationMsg);
        updated.scores = { ...updated.scores, E3_copywriting: result.score };
        if (result.disqualify) {
          handleDisqualify('sin_copywriting');
          return;
        }
        updated.highlight = data.reactivationMsg;
        break;
      }

      case 6: { // Objection
        const result = scoreObjection(data.objectionResponse);
        updated.scores = { ...updated.scores, E4_objeciones: result.score };
        if (result.disqualify) {
          handleDisqualify('sin_objeciones');
          return;
        }
        break;
      }

      case 7: { // Autonomy
        const result = scoreAutonomy(data.autonomyDesc);
        updated.scores = { ...updated.scores, E5_autonomia: result.score };
        updated.flags = { ...updated.flags, baja_ejecucion: result.bajaEjecucion };
        break;
      }

      case 8: { // Philosophy
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

      case 13: { // CV — paso final
        setIsSaving(true);
        updated.totalScore = calculateTotalScore(updated);
        updated.status = calculateFinalStatus(updated);
        updated.completedAt = new Date().toISOString();

        saveLocal(updated);
        saveCompleted(updated);

        // Notificar a GoHighLevel (fire and forget — no bloquea el flujo)
        sendWebhook(updated);

        const { error } = await completeInSupabase(updated);
        if (error) {
          toast.error('Error al guardar tu evaluación. Reintentando...', {
            action: {
              label: 'Reintentar',
              onClick: () => handleNext(data),
            },
          });
          setIsSaving(false);
          return;
        }

        setIsSaving(false);
        navigate(`/result/${updated.sessionId}`);
        return;
      }
    }

    // Avanzar al siguiente paso
    updated.currentStep = step + 1;
    updated.totalScore = calculateTotalScore(updated);
    setState(updated);
    saveLocal(updated);

    // Sync con Supabase en background (no bloquea la UI)
    syncToSupabase(updated);
  }, [state, isSaving, navigate, handleDisqualify]);

  // ─── Guard: parámetros inválidos ────────────────────────────────────────────

  if (!name || !phone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 max-w-md text-center">
          <MagnetLogo size="lg" />
          <p className="text-destructive mt-6 font-medium">
            Enlace inválido. Contacta a tu reclutador.
          </p>
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
              Evaluación de Closer Comercial Remoto
            </p>
            <div className="w-16 h-0.5 gold-gradient mx-auto mb-8" />

            <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
              Hola, {name}
              <WavingHand size={34} />
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Esta evaluación toma aproximadamente 15-20 minutos. Responde con honestidad — evaluamos criterio real, no respuestas perfectas. El proceso debe completarse sin interrupciones.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {['⏱ 15-20 minutos', '📱 Sin pausas', '🎯 Evaluación única'].map((badge) => (
                <span key={badge} className="px-4 py-2 rounded-full border border-primary/30 text-sm text-foreground bg-primary/5">
                  {badge}
                </span>
              ))}
            </div>

            <button
              onClick={handleStart}
              className="gold-gradient text-primary-foreground font-bold py-4 px-10 rounded-full text-lg transition-all hover:opacity-90 active:scale-[0.98] animate-pulse-gold"
            >
              Comenzar Evaluación →
            </button>
          </motion.div>
        </div>
        <footer className="py-4 text-center text-xs text-muted-foreground/50">
          © 2025 Magnetraffic · Proceso confidencial
        </footer>
      </div>
    );
  }

  // ─── Flujo de evaluación ─────────────────────────────────────────────────────

  const progressStep = Math.min(state.currentStep + 1, TOTAL_VISIBLE_STEPS);
  const showProgress = state.currentStep < 12;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <MagnetLogo size="sm" />
          {showProgress && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Paso {progressStep} de {TOTAL_VISIBLE_STEPS}
              </span>
              <div className="w-24 sm:w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gold-gradient rounded-full transition-all duration-500"
                  style={{ width: `${(progressStep / TOTAL_VISIBLE_STEPS) * 100}%` }}
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

      <footer className="py-4 text-center text-xs text-muted-foreground/50">
        Proceso confidencial · Magnetraffic © 2025
      </footer>
    </div>
  );
}

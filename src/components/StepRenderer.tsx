import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EvaluationState } from '@/types/evaluation';

// Step components
import ConsentStep from './steps/ConsentStep';
import BasicInfoStep from './steps/BasicInfoStep';
import ExperienceStep from './steps/ExperienceStep';
import ClosingRoleStep from './steps/ClosingRoleStep';
import IncomeStep from './steps/IncomeStep';
import ReactivationStep from './steps/ReactivationStep';
import ObjectionStep from './steps/ObjectionStep';
import AutonomyStep from './steps/AutonomyStep';
import PhilosophyStep from './steps/PhilosophyStep';
import VerificationStep from './steps/VerificationStep';
import StabilityStep from './steps/StabilityStep';
import FinancialStep from './steps/FinancialStep';
import PreRegistrationStep from './steps/PreRegistrationStep';
import ChurnResistanceStep from './steps/ChurnResistanceStep';
import CVStep from './steps/CVStep';
import InboundOpenStep from './steps/InboundOpenStep';

interface StepRendererProps {
  step: number;
  state: EvaluationState;
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

export default function StepRenderer({ step, state, onNext, onDisqualify }: StepRendererProps) {
  const [direction, setDirection] = useState(1);
  const company = state.company;
  const isTrebolife = company === 'trebolife';
  const isTraduce = company === 'traduce';

  const variants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 },
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <ConsentStep name={state.name} onNext={onNext} onDisqualify={onDisqualify} />;
      case 1: return <BasicInfoStep name={state.name} onNext={onNext} onDisqualify={onDisqualify} company={company} />;
      case 2: return <ExperienceStep onNext={onNext} company={company} />;
      case 3: return <ClosingRoleStep onNext={onNext} onDisqualify={onDisqualify} />;
      case 4: return <IncomeStep onNext={onNext} />;
      case 5: return <ReactivationStep onNext={onNext} onDisqualify={onDisqualify} company={company} />;
      case 6: return <ObjectionStep onNext={onNext} onDisqualify={onDisqualify} company={company} />;
      case 7: return <AutonomyStep onNext={onNext} company={company} />;
      case 8:
        // FASE 10: trebolife/traduce reusan slot 8 con InboundOpenStep
        // (el legacy PhilosophyStep solo se ve en company === null).
        return (isTrebolife || isTraduce)
          ? <InboundOpenStep onNext={onNext} />
          : <PhilosophyStep onNext={onNext} />;
      case 9: return <VerificationStep dailyCalls={state.dailyCalls} onNext={onNext} />;
      case 10: return <StabilityStep name={state.name} onNext={onNext} />;
      case 11: return <FinancialStep onNext={onNext} onDisqualify={onDisqualify} company={company} />;
      case 12:
        // Trebolife: ChurnResistance — cierre con FIT vs presión.
        // Traduce: RetentionResistance — cómo convertir cliente único en recurrente.
        // (Email capturado en BasicInfo para ambas empresas.)
        return (isTrebolife || isTraduce)
          ? <ChurnResistanceStep onNext={onNext} company={company} />
          : <PreRegistrationStep onNext={onNext} />;
      case 13: return <CVStep sessionId={state.sessionId} onNext={onNext} onDisqualify={onDisqualify} />;
      default: return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {renderStep()}
      </motion.div>
    </AnimatePresence>
  );
}

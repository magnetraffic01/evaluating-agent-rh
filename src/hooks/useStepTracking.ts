import { useRef } from 'react';
import { detectDevice } from '@/utils/device';
import { tracking } from '@/lib/api';

export function useStepTracking() {
  const startTimes = useRef<Record<number, number>>({});
  const deviceReported = useRef(false);

  const startStep = (step: number) => {
    if (startTimes.current[step] === undefined) {
      startTimes.current[step] = Date.now();
    }
  };

  const endStepAndReport = (step: number, sessionId: string) => {
    const startedAt = startTimes.current[step];
    if (!startedAt) return;
    const duration = Math.round((Date.now() - startedAt) / 1000);
    delete startTimes.current[step];
    if (duration < 0 || duration > 3600) return; // safety bounds
    const payload: Parameters<typeof tracking.stepEvent>[0] = {
      session_id: sessionId,
      step,
      duration_seconds: duration,
    };
    if (!deviceReported.current) {
      payload.device_type = detectDevice();
      deviceReported.current = true;
    }
    // Fire-and-forget: nunca bloquea al candidato
    tracking.stepEvent(payload).catch(() => {});
  };

  return { startStep, endStepAndReport };
}

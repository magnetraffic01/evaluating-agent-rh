import { EvaluationState } from '@/types/evaluation';

const WEBHOOK_URL = import.meta.env.VITE_GHL_WEBHOOK_URL;

const CALENDAR_ELITE = import.meta.env.VITE_CALENDAR_ELITE
  || 'https://link.magnetraffic.com/widget/bookings/presentacion-closer';
const CALENDAR_STD   = import.meta.env.VITE_CALENDAR_STD
  || 'https://link.magnetraffic.com/widget/bookings/presentacion-closer';

export interface WebhookPayload {
  name:          string;
  phone:         string;
  email:         string | null;
  status:        string;
  score:         number;
  calendar_link: string | null;
  session_id:    string;
  completed_at:  string;
  disqualify_reason: string | null;
  location:      string;
  cv_url:        string;
}

function buildPayload(state: EvaluationState): WebhookPayload {
  let calendar_link: string | null = null;
  if (state.status === 'elite')      calendar_link = CALENDAR_ELITE;
  if (state.status === 'calificado') calendar_link = CALENDAR_STD;

  return {
    name:             state.name,
    phone:            state.phone,
    email:            state.email || null,
    status:           state.status,
    score:            state.totalScore,
    calendar_link,
    session_id:       state.sessionId,
    completed_at:     state.completedAt || new Date().toISOString(),
    disqualify_reason: state.disqualifyReason || null,
    location:         state.location || '',
    cv_url:           state.cvUrl || state.linkedinUrl || '',
  };
}

/**
 * Envía el resultado de la evaluación al webhook de GoHighLevel.
 * Fire-and-forget: no bloquea el flujo si falla.
 * Solo se ejecuta si VITE_GHL_WEBHOOK_URL está configurado.
 */
export async function sendWebhook(state: EvaluationState): Promise<void> {
  if (!WEBHOOK_URL) {
    if (import.meta.env.DEV) {
      console.log('[Webhook] VITE_GHL_WEBHOOK_URL no configurado — omitiendo.');
    }
    return;
  }

  const payload = buildPayload(state);

  if (import.meta.env.DEV) {
    console.log('[Webhook] Enviando payload a GHL:', payload);
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok && import.meta.env.DEV) {
      console.warn('[Webhook] Respuesta no OK:', response.status, response.statusText);
    }
  } catch (err) {
    // No interrumpimos el flujo del candidato si el webhook falla
    if (import.meta.env.DEV) {
      console.error('[Webhook] Error de red:', err);
    }
  }
}

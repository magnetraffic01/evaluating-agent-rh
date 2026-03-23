import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || 'magtrrhh2026';

// Mapeo de nombre/email/ID GHL → etiqueta de reclutador
// Agregar nuevas entradas cuando se incorporen más reclutadores
const RECRUITER_MAP: Record<string, string> = {
  // Juliana Castrillón (Reclutador 1) — múltiples formatos posibles
  'juliana castrillon':              'Reclutador 1',
  'juliana castrillón':              'Reclutador 1',
  'juliana':                         'Reclutador 1',
  'manager@finanzaparalatinos.com':  'Reclutador 1',
  'y9etbqml6yxo6z3as8xw':           'Reclutador 1',  // GHL user ID (enviado por n8n)
  // Traduce US (Reclutador 2)
  'traduce us':                      'Reclutador 2',
  'info@traduce.us':                 'Reclutador 2',
  'blcv7ez4gifnduyк1vry':            'Reclutador 2',  // GHL user ID
};

function resolveRecruiter(user: { firstName?: string; lastName?: string; email?: string } | undefined): string | null {
  if (!user) return null;
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
  const email    = (user.email || '').toLowerCase();
  return RECRUITER_MAP[fullName] || RECRUITER_MAP[email] || null;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const secret = req.headers.get('x-webhook-secret');
  if (secret !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  // GHL envía el body completo del contacto — extraer los campos correctos
  // Log completo para diagnóstico (keys del body)
  console.log('[body keys]', Object.keys(body));
  console.log('[body raw]', JSON.stringify(body).slice(0, 500));

  const rawPhone      = body.phone || body.customData?.phone || '';
  const interviewDate = body.calendar?.startTime || body.interview_date || body.customData?.interview_date || null;

  const rawAssignedTo = (body.assigned_to || body.customData?.assigned_to || '') as string;
  // Intentar resolver: primero objeto user (si viene), luego mapa por nombre/email/ID
  const resolved = resolveRecruiter(body.user)
    || RECRUITER_MAP[rawAssignedTo.trim().toLowerCase()]
    || (rawAssignedTo.trim() ? rawAssignedTo.trim() : null);

  // Si no se resuelve el reclutador, NO sobreescribir el valor existente en DB
  const assignedTo = resolved;

  console.log('[parsed]', { rawPhone, interviewDate, rawAssignedTo, assignedTo });

  if (!rawPhone) {
    return new Response(JSON.stringify({ error: 'Missing phone' }), { status: 400 });
  }

  const last10 = normalizePhone(rawPhone);

  const { data: rows, error: fetchError } = await supabase
    .from('evaluations')
    .select('session_id, phone')
    .ilike('phone', `%${last10}`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No evaluation found', phone: rawPhone, last10 }),
      { status: 404 },
    );
  }

  const match = rows[0];

  // Solo incluir assigned_to en el update si se resolvió (evitar sobreescribir con null)
  const updatePayload: Record<string, unknown> = {
    interview_status: 'agendada',
    interview_date:   interviewDate,
  };
  if (assignedTo !== null) {
    updatePayload.assigned_to = assignedTo;
  }

  const { error: updateError } = await supabase
    .from('evaluations')
    .update(updatePayload)
    .eq('session_id', match.session_id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ success: true, session_id: match.session_id, interview_date: interviewDate, assigned_to: assignedTo }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});

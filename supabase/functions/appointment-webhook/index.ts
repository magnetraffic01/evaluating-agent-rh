import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || 'magtrrhh2026';

// Mapeo de nombre/email GHL → etiqueta de reclutador
// Agregar nuevas entradas cuando se incorporen más reclutadores
const RECRUITER_MAP: Record<string, string> = {
  'juliana castrillon':         'Reclutador 1',
  'juliana castrillón':         'Reclutador 1',
  'manager@finanzaparalatinos.com': 'Reclutador 1',
  'traduce us':                 'Reclutador 2',
  'info@traduce.us':            'Reclutador 2',
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
  const rawPhone      = body.phone || body.customData?.phone || '';
  const interviewDate = body.calendar?.startTime || body.customData?.interview_date || null;
  const assignedTo    = resolveRecruiter(body.user) || body.customData?.assigned_to || null;

  console.log('[parsed]', { rawPhone, interviewDate, assignedTo });

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

  const { error: updateError } = await supabase
    .from('evaluations')
    .update({
      interview_status: 'agendada',
      interview_date:   interviewDate,
      assigned_to:      assignedTo,
    })
    .eq('session_id', match.session_id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ success: true, session_id: match.session_id, interview_date: interviewDate, assigned_to: assignedTo }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});

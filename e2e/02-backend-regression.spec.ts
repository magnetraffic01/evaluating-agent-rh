import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * Tests de regresión backend (los 7 bugs que se arreglaron en el bug hunt).
 * Corren contra el API directamente sin necesidad de UI.
 */

const API = 'https://magnetraffic-rrhh-backend.jdaoel.easypanel.host';
const ADMIN = { email: 'agarces@magnetraffic.com', password: 'Info2026$$' };

async function getAdminToken(req: any) {
  const res = await req.post(`${API}/api/hr/auth/login`, { data: ADMIN });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.token;
}

test('Bug #2: POST /evaluations es idempotente con mismo session_id', async () => {
  const req = await pwRequest.newContext();
  const sessionId = crypto.randomUUID();
  const payload = { session_id: sessionId, name: 'PW Idem', phone: `+1888${Date.now() % 1000000}` };

  const r1 = await req.post(`${API}/api/hr/evaluations`, { data: payload });
  expect(r1.status()).toBe(201);
  const b1 = await r1.json();

  const r2 = await req.post(`${API}/api/hr/evaluations`, { data: payload });
  expect(r2.status()).toBe(200); // No 409, devuelve idempotent
  const b2 = await r2.json();

  expect(b2.id).toBe(b1.id);
  expect(b2.idempotent).toBe(true);
});

test('Bug #1: PATCH evaluations bloquea auto-promoción a elite con score bajo', async () => {
  const req = await pwRequest.newContext();
  const sessionId = crypto.randomUUID();

  // Crear primero
  const create = await req.post(`${API}/api/hr/evaluations`, {
    data: { session_id: sessionId, name: 'PW AntiTamp', phone: `+1888${Date.now() % 1000000}` }
  });
  const { id } = await create.json();

  // Intento de tampering: status=elite con score 50
  const tamper = await req.patch(`${API}/api/hr/evaluations/${id}`, {
    data: { status: 'elite', score_total: 50 }
  });
  expect(tamper.status()).toBe(400);
  const errBody = await tamper.json();
  expect(errBody.error).toBe('status_score_mismatch');
  expect(errBody.need_min).toBe(115);

  // Status válido pasa
  const valid = await req.patch(`${API}/api/hr/evaluations/${id}`, {
    data: { status: 'elite', score_total: 120 }
  });
  expect(valid.status()).toBe(200);
});

test('Bug #1: PATCH bloquea campos admin-only sin auth', async () => {
  const req = await pwRequest.newContext();
  const fakeId = crypto.randomUUID();

  const r = await req.patch(`${API}/api/hr/evaluations/${fakeId}`, {
    data: { interview_date: '2026-01-01' }
  });
  expect(r.status()).toBe(403);
  const body = await r.json();
  expect(body.error).toBe('admin_only_fields');
  expect(body.fields).toContain('interview_date');
});

test('Bug #3: PATCH hired-status devuelve 404 si id no existe', async () => {
  const req = await pwRequest.newContext();
  const token = await getAdminToken(req);

  const r = await req.patch(`${API}/api/hr/evaluations/00000000-0000-0000-0000-000000000000/hired-status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { hired_status: 'hired' }
  });
  expect(r.status()).toBe(404);
});

test('Webhook secret obligatorio', async () => {
  const req = await pwRequest.newContext();

  const noSecret = await req.post(`${API}/api/hr/webhooks/appointment`, { data: {} });
  expect(noSecret.status()).toBe(401);

  const wrongSecret = await req.post(`${API}/api/hr/webhooks/appointment`, {
    headers: { 'x-webhook-secret': 'WRONG' },
    data: {}
  });
  expect(wrongSecret.status()).toBe(401);
});

test('Score endpoint Haiku LLM responde con score válido', async () => {
  const req = await pwRequest.newContext();
  const r = await req.post(`${API}/api/hr/score/text`, {
    data: {
      field: 'reactivation',
      text: 'Hola Juan, vi que pediste info hace 3 semanas — abrimos 3 cupos esta semana con bono que vence el viernes. ¿Te lo aparto?'
    }
  });
  expect(r.ok()).toBeTruthy();
  const body = await r.json();
  expect(typeof body.score).toBe('number');
  expect(body.score).toBeGreaterThanOrEqual(0);
  expect(body.score).toBeLessThanOrEqual(20);
});

test('Companies decide devuelve company válida', async () => {
  const req = await pwRequest.newContext();
  const r = await req.post(`${API}/api/hr/companies/decide`);
  expect(r.ok()).toBeTruthy();
  const body = await r.json();
  expect(['trebolife', 'traduce']).toContain(body.company);
});

// IMPORTANTE: este test consume rate-limit window. Se ejecuta AL FINAL para no afectar otros.
test('Bug #5: /companies/decide rate-limited a 30 req/min', async () => {
  const req = await pwRequest.newContext();
  const codes: number[] = [];
  for (let i = 0; i < 35; i++) {
    const r = await req.post(`${API}/api/hr/companies/decide`);
    codes.push(r.status());
  }
  const ok = codes.filter(c => c === 200).length;
  const limited = codes.filter(c => c === 429).length;
  expect(ok).toBeLessThanOrEqual(30);
  expect(limited).toBeGreaterThanOrEqual(1);
});

test('Recruiters assign filtra por company', async () => {
  const req = await pwRequest.newContext();

  // Trebolife está activo → debe responder 200 con label + calendar_url.
  const trebo = await req.post(`${API}/api/hr/recruiters/assign`, { data: { company: 'trebolife' } });
  expect(trebo.ok()).toBeTruthy();
  const tBody = await trebo.json();
  expect(tBody.label).toBeTruthy();
  expect(tBody.calendar_url).toMatch(/^https?:\/\//);

  // Traduce: el admin puede apagarlo desde el panel de reclutadoras
  // (active=False en hr_recruiter_companies). Aceptamos AMBOS escenarios:
  //   - 200 con label/calendar_url cuando hay recruiters habilitados
  //   - 503 'no_active_recruiters' cuando el admin lo apagó
  // Ambos son comportamientos VÁLIDOS del sistema.
  const trad = await req.post(`${API}/api/hr/recruiters/assign`, { data: { company: 'traduce' } });
  if (trad.ok()) {
    const body = await trad.json();
    expect(body.label).toBeTruthy();
    expect(body.calendar_url).toMatch(/^https?:\/\//);
  } else {
    expect(trad.status()).toBe(503);
    const body = await trad.json();
    expect(body.error).toBe('no_active_recruiters');
  }
});

# AUDIT — Magnetraffic HR Evaluator

**Fecha:** 2026-04-17
**Auditor:** Amed + Claude Code
**Alcance:** código estático (9,357 LOC) + RLS reales del proyecto Supabase `magnetraffic-hr` (ref `oeqqhsrwhxmwoxtluflf`) + prueba de explotación con `anon_key` real.

---

## 🚨 Incidente confirmado — P0

Se confirmó en vivo, desde fuera, usando solo el `anon_key` que vive en el bundle JS público de `evaluating-agent-rh.netlify.app`:

| Vector | Policy encontrada | Resultado |
|--------|-------------------|-----------|
| `SELECT` PII de candidatos | `anon_select USING(true)` en `evaluations` | 1,880 registros · 934 completados con nombre, teléfono, email, CV firmado |
| `UPDATE` de cualquier evaluación | `anon_update USING(true)` en `evaluations` | HTTP 204 — cualquiera se marca `status='elite'` |
| `UPDATE` calendar_url de recruiters | `Anon puede actualizar reclutadores` | Acepta (no ejecutado) — redirige candidatos élite a link de phishing |
| `INSERT` reclutador falso con weight=100 | `Anon puede insertar reclutadores` | Acepta (no ejecutado) — atacante recibe 100% de los candidatos |

### Volumen

- 1,880 evaluaciones · 934 completadas (PII real de candidatos reales)
- anon_key legacy (`eyJ...`) + `sb_publishable_*` ambas comprometidas
- service_role legacy (`eyJ...`) presente en git history commit `c4e961d`

---

## Findings

### 🔴 P0 — Crítico seguridad

1. **Password admin hardcodeado en repo público** — `src/pages/Admin.tsx:10` tiene `ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Info2030x'`.
2. **Admin auth client-side** — password vive en bundle JS via prefijo `VITE_`, extraíble con DevTools.
3. **RLS `UPDATE USING(true)`** en `evaluations` para rol `anon`.
4. **RLS `SELECT USING(true)`** en `evaluations` para rol `anon` → PII expuesta.
5. **Recruiters world-writable** — SELECT/INSERT/UPDATE abiertos a anon.
6. **Webhook GHL sin HMAC** — URL en `VITE_GHL_WEBHOOK_URL` del bundle cliente, sin firma.
7. **Secretos en git history** — commit inicial `c4e961d` contiene tokens `eyJ...`.

### 🟠 P1 — Correctitud

8. Bug homoglyph cirílico — `Admin.tsx:229` tiene `к` (U+043A) en lugar de `k` latina en el ID GHL de Reclutador 2. El lookup nunca hace match.
9. `supabase-schema.sql` desactualizado — faltan columnas `answers`, `assigned_to`, `interview_status`, `interview_date`, `recruiter_notes`. Sin sistema de migraciones.
10. `calculateFinalStatus` en `src/utils/scoring.ts` no setea `disqualifyReason` cuando score < POTENCIAL → admin queda inconsistente.
11. Trampa V1 (mostrar mitad de `daily_calls`) declarada en scoring pero no implementada en ningún step.
12. Scoring por regex en E3/E4/E5 — candidato que conoce el patrón suma 20 pts con "imagina urgente oportunidad".
13. Reactivación genérica larga saca 10 pts — inconsistente con `MANDATORY_DISQUALIFIERS.sin_copywriting` de la spec.
14. Parámetro `?recruiter=X` de URL aceptado sin validar contra tabla `recruiters`.
15. `ip_address` nunca capturado (cliente no puede leer su propia IP).

### 🟡 P2 — Robustez

16. localStorage manipulable — `Result.tsx:237` lee `eval_${sessionId}` del cliente; candidato puede forzar `status`.
17. Doble tab con mismo phone → race condition sobre upsert.
18. Timeout 60min se chequea solo al cargar, no inline.
19. Sin rate limit ni captcha en el endpoint público.
20. Tres lockfiles coexisten (`bun.lock`, `bun.lockb`, `package-lock.json`).
21. Tests triviales — solo `src/test/example.test.ts`.

---

## ✅ Fortalezas (15)

1. Arquitectura limpia: `pages / hooks / lib / utils / components/steps` bien separados.
2. TypeScript tipado estricto sin abuso de `any`.
3. `session_id UNIQUE` + upsert → reanudación idempotente.
4. CV privado con URL firmada (1 año al guardar, 1h al visualizar en admin).
5. Anti-retroceso navegador correcto (`popstate` + `pushState`).
6. Admin dashboard con UX sólida: filtros por fecha con presets, reclutador, búsqueda, modal con 4 tabs, vista print.
7. Round-robin ponderado de reclutadores con RPC server-side `assign_recruiter` (lógica sensible no está en cliente).
8. Portal `/portal` con Supabase Auth real (`signInWithPassword`) — patrón correcto que debe replicarse en `/admin`.
9. Webhook fire-and-forget no bloquea al candidato.
10. i18n ES/EN + theme dark/light preparados.
11. `.gitignore` adecuado.
12. Logs condicionados a `import.meta.env.DEV`.
13. Netlify SPA redirect correctamente configurado.
14. RLS habilitado en las 3 tablas (aunque policies mal hechas).
15. Sanitización de nombres de archivos en upload de CV.

---

## Plan de remediación — 3 fases

### Fase 1 — Stop the bleed (5 min — rompe `/admin` temporalmente)

```sql
DROP POLICY "anon_select" ON evaluations;
DROP POLICY "anon_update" ON evaluations;
DROP POLICY "Anyone can update evaluations" ON evaluations;
DROP POLICY "Anon puede actualizar reclutadores" ON recruiters;
DROP POLICY "Anon puede insertar reclutadores" ON recruiters;
DROP POLICY "Anon puede leer reclutadores" ON recruiters;

CREATE POLICY "anon_update_own_progress" ON evaluations FOR UPDATE TO anon
  USING (status = 'en_progreso')
  WITH CHECK (status = 'en_progreso');
```

Post-Fase 1:
- Candidatos siguen completando evaluación.
- `/admin` deja de funcionar hasta Fase 2.
- PII de 934 candidatos completados queda oculta.

### Fase 2 — Migrar `/admin` a Supabase Auth (~30 min)

- Crear tabla `admins (id uuid references auth.users, email text)`.
- Registrar usuario admin real.
- Reescribir `src/pages/Admin.tsx` con `supabaseAuth.auth.signInWithPassword` (patrón de `Portal.tsx`).
- Nueva policy: `CREATE POLICY admin_read ON evaluations FOR SELECT TO authenticated USING (auth.uid() IN (SELECT id FROM admins))`.
- Eliminar `VITE_ADMIN_PASSWORD` y el fallback `'Info2030x'`.

### Fase 3 — Rotar keys + redeploy

- Revocar `anon_key` legacy y `service_role` legacy en Supabase dashboard.
- Actualizar Netlify env con el nuevo `sb_publishable_*`.
- Redeploy Netlify.

---

## Quick wins adicionales

- Corregir homoglyph cirílico `к` → `k` en `src/pages/Admin.tsx:229`.
- Sincronizar `supabase-schema.sql` con el estado real (o adoptar Supabase CLI migrations).
- Unificar lockfiles (elegir uno: bun o npm).
- Agregar Cloudflare Turnstile en step 0.
- Implementar la trampa V1 que falta.

---

## Descubrimiento colateral

El PAT da acceso a 3 proyectos Supabase de la cuenta Amed:

- `oeqqhsrwhxmwoxtluflf` — magnetraffic-hr (auditado aquí)
- `qzuiqwtecadmoaagmsvs` — TREBOLIFE AFILIADO (⚠️ no auditado — verificar RLS)
- `rkomdqrzlasqtahseehv` — VICTIMAS DEL SOCIALISMO (⚠️ no auditado — verificar RLS)

El patrón "Lovable + RLS anon abierto" puede repetirse. Audit pendiente.

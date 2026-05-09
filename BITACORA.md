# BITACORA — Magnetraffic HR Evaluator (fork agarces-stack)

Registro de sesiones y cambios del fork en `agarces-stack/magnetraffic-hr-evaluator`.

---

## 2026-04-17 · Sesión 1 — Fork + Audit

**Objetivo:** respaldar el repo original, documentarlo y auditar seguridad.

**Completado:**

- [x] `git clone --mirror magnetraffic01/evaluating-agent-rh` → push a `agarces-stack/magnetraffic-hr-evaluator` (privado).
- [x] Página Obsidian `MT-Wiki/projects/magnetraffic-hr-evaluator.md` con stack, scoring, sesiones 1-5, pendientes, credenciales.
- [x] Auditoría estática del código — 21 findings (6 P0 + 8 P1 + 7 P2) y 15 fortalezas documentados en `AUDIT.md`.
- [x] PAT Supabase movido de Descargas a `APPI Y CLAVE/APIs y Claves/Dev Tools/Supabase - Amed.md`.
- [x] Audit en vivo con PAT via Supabase Management API:
  - `pg_policies` confirmó `anon_select`/`anon_update` con `USING(true)` en `evaluations`.
  - `recruiters` world-writable para anon.
  - 1,880 evaluaciones · 934 completadas con PII expuesta.
- [x] **Proof-of-exploit** desde fuera con solo `anon_key`:
  - Leí nombres, teléfonos, emails, CVs de 3 candidatos reales.
  - Ejecuté UPDATE sobre una evaluación (status reversible) — HTTP 204.
- [x] Obsidian audit page `MT-Wiki/projects/magnetraffic-hr-evaluator-audit.md`.
- [x] Regla en auto-memoria `feedback_magnetraffic_hr_rls_incident.md`.
- [x] Commit `AUDIT.md` + `BITACORA.md` en este repo.

**Pendiente (Fases 2-3):**

- [ ] **Fase 2** — migrar `/admin` a Supabase Auth (crear tabla `admins`, reescribir `Admin.tsx`).
- [ ] **Fase 3** — rotar `anon_key` y `service_role` legacy + redeploy Netlify.
- [ ] Corregir homoglyph cirílico `к` → `k` en `src/pages/Admin.tsx:229`.
- [ ] Sincronizar `supabase-schema.sql` con estado real de la tabla.
- [ ] Auditar los otros 2 proyectos Supabase de la cuenta (TREBOLIFE AFILIADO, VICTIMAS DEL SOCIALISMO).

---

## 2026-04-18 · Sesión 2 — Fase 1 ejecutada (stop-the-bleed)

**Objetivo:** cerrar la brecha RLS detectada el 2026-04-17.

**SQL ejecutado** (via Supabase Management API con PAT):

```sql
DROP POLICY IF EXISTS "anon_select" ON evaluations;
DROP POLICY IF EXISTS "anon_update" ON evaluations;
DROP POLICY IF EXISTS "Anyone can update evaluations" ON evaluations;
DROP POLICY IF EXISTS "Anon puede actualizar reclutadores" ON recruiters;
DROP POLICY IF EXISTS "Anon puede insertar reclutadores" ON recruiters;
DROP POLICY IF EXISTS "Anon puede leer reclutadores" ON recruiters;
CREATE POLICY "anon_update_own_progress" ON evaluations FOR UPDATE TO anon
  USING (status = 'en_progreso') WITH CHECK (status = 'en_progreso');
```

Archivo aplicado: `phase1.sql` — HTTP 201 OK.

**Verificación (re-test desde fuera con anon_key):**

| Ataque | Antes | Después |
|--------|-------|---------|
| SELECT PII evaluations | 1,880 filas | 0 filas (HTTP 200, vacío) |
| UPDATE status='elite' en evaluación descartada | HTTP 204 + cambio real | HTTP 204 pero status NO cambia (RLS filtra) |
| INSERT recruiter malicioso | Aceptaba | HTTP 401 bloqueado |
| SELECT recruiters | Listaba todos | 0 filas |
| INSERT nueva evaluación (candidato) | OK | OK — HTTP 201 (flujo intacto) |
| UPDATE progreso en_progreso (candidato) | OK | OK — HTTP 204 (flujo intacto) |

**Estado post-Fase 1:**

- ✅ Brecha de PII cerrada — los 934 candidatos completados ya no son accesibles con el anon_key.
- ✅ UPDATE malicioso sobre evaluaciones completas bloqueado.
- ✅ Tabla `recruiters` cerrada a anon (INSERT/UPDATE/SELECT bloqueados).
- ✅ Flujo del candidato (INSERT + UPDATE durante evaluación) sigue funcionando.
- ⚠️ `/admin` **caído** hasta que se ejecute Fase 2 (migración a Supabase Auth). Esperado.

**Archivos nuevos:** `phase1.sql`.

**Archivos creados:**
- `AUDIT.md`
- `BITACORA.md`

**Referencias:**
- Obsidian proyecto: `MT-Wiki/projects/magnetraffic-hr-evaluator.md`
- Obsidian audit: `MT-Wiki/projects/magnetraffic-hr-evaluator-audit.md`
- PAT Supabase: `APPI Y CLAVE/APIs y Claves/Dev Tools/Supabase - Amed.md`
- Repo fuente: `magnetraffic01/evaluating-agent-rh`
- Prod URL: https://evaluating-agent-rh.netlify.app

---

## 2026-04-29 · Sesión 7 — FASE 7: Flow Traduce + 3 features 10/10

**Objetivo:** completar el flow Traduce espejo de Trebolife y cerrar las
3 mejoras pendientes para llevar el sistema a 10/10 (loader LLM, notif
Elite outbound, re-engagement endpoint para n8n).

### Backend (commit `04a063e`)

- **`backend/lib/notifications.js`** *(nuevo)*: helper
  `postJsonFireAndForget` + `notifyEliteAssigned`. Envía POST con header
  `x-webhook-secret` y payload `{event:'elite_assigned', evaluation, recruiter, timestamp}`.
- **`backend/routes/evaluations.js`**: dispara `notifyEliteAssigned`
  dentro del PATCH cuando el UPDATE deja `status='elite' && assigned_to`.
- **`backend/routes/analytics.js`**: nuevo `GET /api/hr/analytics/reengagement`
  con auth por header `x-reengagement-secret` (no JWT, para que n8n cron lo
  consuma). Ventana `min_hours`/`max_hours` configurable, transacción
  `FOR UPDATE` que marca `reengaged_at = NOW()` para idempotencia (n8n
  nunca recibe el mismo dos veces).
- **`backend/db/migration_phase7_reengagement.sql`**: agrega
  `reengaged_at TIMESTAMP NULL` + índice compuesto
  `(status, reengaged_at, last_activity)`.
- **`backend/routes/admin-migrations.js`**: añade `phase7` al runner
  remoto para ejecutar migration desde `/api/hr/admin/migrations/run/phase7`.
- **`backend/.env.example`**: documenta `ELITE_NOTIFICATION_WEBHOOK`,
  `ELITE_NOTIFICATION_SECRET` y `REENGAGEMENT_SECRET`.

### Frontend (commit `ff237ab`)

- **Loader LLM** en `src/pages/Evaluate.tsx`: overlay con spinner +
  mensaje "Analizando tu respuesta…" en pasos 5/6/7 mientras se procesa
  scoring open-text con Claude Haiku.
- **Flow Traduce completo (11 pasos espejo de Trebolife):**
  - `types/evaluation.ts`: `SKIPPED_STEPS_BY_COMPANY['traduce'] = {0,8,9}`
    + `getTotalVisibleSteps('traduce') = 11`.
  - `BasicInfoStep`: email + 40h+ con descripción Traduce.
  - `ExperienceStep`: contexto USCIS / trámite migratorio + bundling
    embebido (ahorro paquete familiar vs documento unitario).
  - `ReactivationStep`: escenario "cotización hace 1 mes".
  - `ObjectionStep`: "déjame pensarlo" día 8 (recargo USCIS por demora).
  - `AutonomyStep`: 80 leads CRM / pipeline (HubSpot, secuencias).
  - `FinancialStep`: ramp-up con ticket $100, proyecciones mensuales.
  - `ChurnResistanceStep`: retención/recurrencia (Carlos terminó
    naturalización → cómo volverlo recurrente).
  - `StepRenderer`: pasa `company` a Reactivation/Autonomy/ChurnResistance.
- **i18n**: 17 keys ES + 17 EN para Traduce
  (`*_traduce` variantes en `src/i18n/translations.ts`).
- **`llm_analyzing_title` / `llm_analyzing_subtitle`** ES + EN.

### E2E

- **`e2e/04-evaluate-traduce-flow.spec.ts`** *(nuevo)*: corre el flow
  completo Traduce con `?company=traduce`. Asserts:
  - Step 0 (Consent) saltado, BasicInfo arranca en "Paso 1 de 11".
  - Texto Experience contiene `USCIS|trámite|migra`.
  - Reactivation contiene `cotización|1 mes|mes`.
  - Objection contiene `déjame pensarlo|día 8|8 días`.
  - Autonomy contiene `80|pipeline|CRM|lead`.
  - Ramp-up contiene `$100|ticket|comisión`.
  - Retention contiene `recurrente|Carlos|naturalizaci`.
  - Final: `status ∈ {elite, calificado}`, `score ≥ 80`,
    `company === 'traduce'`, `currentStep === 13`.

### Estado del sistema

- TypeScript frontend: 0 errores.
- Backend node --check: pasa en analytics, evaluations, admin-migrations,
  notifications.
- Total tests automatizados: 23 backend smoke + 13 Playwright (10
  existentes + 3 nuevos del flow Traduce).

### Pendiente operativo

- [ ] Trigger deploy backend en EasyPanel y correr
  `POST /api/hr/admin/migrations/run/phase7` (admin auth).
- [ ] Configurar env vars en EasyPanel:
  `ELITE_NOTIFICATION_WEBHOOK`, `ELITE_NOTIFICATION_SECRET`,
  `REENGAGEMENT_SECRET`.
- [ ] Configurar workflow GHL/n8n receiver para `event=elite_assigned`.
- [ ] Configurar n8n cron diario que consume `/reengagement` con secret.
- [ ] Verificar deploy Netlify y correr suite E2E completa contra prod.

**Repos:**
- Backend: `agarces-stack/magnetraffic-hr` @ `04a063e`
- Frontend: `agarces-stack/magnetraffic-hr-evaluator` @ `ff237ab`

---

## 2026-05-06 / 2026-05-08 · Sesión 8 — Auditoría operacional GHL calendar downstream + capacity fix

> **Nota:** sesión operacional sobre infraestructura GHL, no FASE de desarrollo. No se tocó código del repo. La constante `CALENDAR_LINKS.CALIFICADO` (`https://link.magnetraffic.com/widget/bookings/entrevista-para-closer`) en `src/constants/links.ts` se validó intacta.

**Objetivo:** atacar los issues abiertos en el wiki (`magnetraffic-hr-evaluator.md` sección "Issues detectados") sobre el calendar GHL al que la app envía a los candidatos calificados. Sub-account afectado: `MAGNETRAFFIC RRHH` (`zlIg4LBlQo6cBrlDQyUN`).

### Hallazgos

#### Issue #1 — Drift de URL del calendar custom alias → FALSO POSITIVO ^[verified]

Riesgo declarado: ¿la URL hardcoded en `src/constants/links.ts` apunta al calendar viejo (borrado) o al nuevo?

Verificación dual:

- **API GHL:** en RRHH solo existe el calendar `vtUBwLlsQTJNqplZe0rU` con `widgetSlug=entrevista-para-closer`. En el sub-account MagneTraffic principal (8 calendars listados) ningún slug coincide. Calendar viejo `Wzb64Z8SC8kYfuDTBJzE` retorna HTTP 400 (ya borrado).
- **Playwright sobre la URL pública:** el HTML cargado contiene el calendarId `vtUBwLlsQTJNqplZe0rU`, título "PRESENTACION CLOSER NEW" y horarios consistentes. Cloudflare bot challenge bloquea curl simple — irrelevante, el dominio resuelve OK a infra GHL.

Screenshot: `Downloads/ghl_audit/widget_alias_2026-05-06.png`. **La constante en `src/constants/links.ts` no necesita cambio.**

#### Issue #2 — Capacidad de registro insuficiente → FIX APLICADO ^[verified]

Síntoma reportado: "el calendar solo deja registrar pocas personas, debería permitir ≥100/día". Diagnóstico vía `/free-slots` next-14-days:

| Métrica | ANTES | INTERMEDIO (06) | FINAL (08) |
|---|---|---|---|
| Slots/día | 2 (11am, 3pm ET) | 3 (11am, 1pm, 3pm) | 2 (11am, 3pm) |
| `allowBookingAfter` | 24h (mata same-day) | **2h** | **2h** |
| `appoinmentPerSlot` | 1000 | 1000 | 1000 |
| `appoinmentPerDay` | 2000 | 3000 | 3000 (cap, real efectivo = 2K) |
| Slots libres próx 14d | 18 | 29 | 20 |

**Iteración intermedia 2026-05-06:** se sumó ventana 13–14 ET (3 ventanas/día). **Revert 2026-05-08:** Amed decidió mantener solo 11am y 3pm. El revert deja `allowBookingAfter` en 2h y `appoinmentPerDay` en 3000 (cap inútil pero inocuo).

Backups: `Downloads/ghl_audit/cal_new_pre_2026-05-06.json`, `cal_pre_revert_1pm.json`.

#### Issue #5 — eventType `RoundRobin_OptimizeForAvailability` con 1 team member → DESCARTADO con evidencia ^[inferred]

Hipótesis inicial: aunque `appoinmentPerSlot=1000`, RR podría capar al saturar a Juliana (host único). Evidencia empírica débil — al subir slots de 2→3/día y revertir limpio, GHL respetó los cambios sin "saturación oculta". Recomendación: monitorear 48–72h antes de tocar.

#### Issue #3 — Juliana Castrillón duplicada en RRHH → PENDIENTE

Dos usuarias con mismo nombre y mismo teléfono en sub-account RRHH:

| | J1 (Manager@finanzaparalatinos.com) | J2 (juliana.manager@magnetraffic.com) |
|---|---|---|
| ID | `Y9EtBQmL6yxo6z3aS8xw` | `sGTCBmTw4S5jwadIOR6l` |
| Role | admin | user |
| Contactos asignados | 98 | 0 |
| Appointments próx 30d | 5 | 0 |
| Calendar host | sí | no |

J2 es ghost dentro de RRHH (también activa en otros 5 sub-accounts). Verificado que **no aparece referenciada en ningún workflow** de RRHH (5 workflows revisados, incluyendo "Asignar Reclutador").

Intento de remoción API: PIT no tiene scope `users/team-management.write` — DELETE y PUT retornan 401. Amed intentó remoción manual desde panel pero el `roles.locationIds` quedó intacto (verificado con monitor de polling 30s × 6 attempts → siempre `YES en RRHH`). La acción manual fue otra que la esperada. Pendiente segundo intento con instrucciones de UI más explícitas, o ruta Playwright con login interactivo.

### Lección crítica registrada

**GHL Calendar PUT es REPLACE, no PATCH.** Un PUT minimal con `{"allowBookingAfter": 2}` retornó HTTP 200 pero borró silenciosamente `openHours` (5 días → 0) y reseteó `slotDuration` (60 → 30). Restore desde backup requirió iterar removiendo campos rechazados (HTTP 422 sobre `formSubmitRedirectUrl`, presente en GET pero rechazado en PUT). Patrón seguro: GET → backup → modificar body completo → drop iterativo en 422 → PUT → GET + diff verificación.

Documentado en:
- Wiki: `MT-Wiki/concepts/ghl-api-put-replace-semantics.md` (nuevo)
- Memoria: `feedback_ghl_calendar_put_replace.md`

### Cambios de config aplicados a `vtUBwLlsQTJNqplZe0rU`

```
allowBookingAfter:   24h    →  2h
openHours:           sin cambio neto (sumé 13–14 el 06, revertí el 08)
appoinmentPerDay:    2000   →  3000   (cap, no se revertió)
appoinmentPerSlot:   1000   →  1000   (sin cambio)
eventType:           sin cambio
slotDuration:        sin cambio
isActive:            sin cambio
```

### Archivos modificados en este repo

Solo `BITACORA.md` — la sesión no tocó código.

### Pendientes (heredados al wiki)

- [ ] **Juliana zombie** — segundo intento de remoción manual con path canónico, o ruta Playwright
- [ ] **n8n workflows** — auditar workflows MagneTraffic por hardcode del `calendarId` viejo `Wzb64Z8SC8kYfuDTBJzE`
- [ ] **eventType monitoring** — 48–72h con datos de bookings reales antes de decidir si tocar RR

### Referencias

- Wiki proyecto: `MT-Wiki/projects/magnetraffic-hr-evaluator.md`
- Wiki concepts: `MT-Wiki/concepts/ghl-api-put-replace-semantics.md` (nuevo)
- Wiki skill: `MT-Wiki/skills/ghl-class-booking-mass-interviews.md`
- Memoria: `feedback_ghl_calendar_put_replace.md`
- Backups operativos: `Downloads/ghl_audit/cal_new_pre_2026-05-06.json`, `cal_pre_revert_1pm.json`, `widget_alias_2026-05-06.png`
- PIT GHL RRHH: `APPI Y CLAVE/01-Claves-y-APIs/GHL-Sub-Accounts/GHL - MagneTraffic RRHH.md`


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

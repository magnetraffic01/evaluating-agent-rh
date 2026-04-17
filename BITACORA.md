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

**Pendiente (Fases 1-3 del plan):**

- [ ] **Fase 1** — ejecutar SQL para cerrar la brecha (dropear 6 policies + crear anon_update_own_progress).
- [ ] **Fase 2** — migrar `/admin` a Supabase Auth (crear tabla `admins`, reescribir `Admin.tsx`).
- [ ] **Fase 3** — rotar `anon_key` y `service_role` legacy + redeploy Netlify.
- [ ] Corregir homoglyph cirílico `к` → `k` en `src/pages/Admin.tsx:229`.
- [ ] Sincronizar `supabase-schema.sql` con estado real de la tabla.
- [ ] Auditar los otros 2 proyectos Supabase de la cuenta (TREBOLIFE AFILIADO, VICTIMAS DEL SOCIALISMO).

**Archivos creados:**
- `AUDIT.md`
- `BITACORA.md`

**Referencias:**
- Obsidian proyecto: `MT-Wiki/projects/magnetraffic-hr-evaluator.md`
- Obsidian audit: `MT-Wiki/projects/magnetraffic-hr-evaluator-audit.md`
- PAT Supabase: `APPI Y CLAVE/APIs y Claves/Dev Tools/Supabase - Amed.md`
- Repo fuente: `magnetraffic01/evaluating-agent-rh`
- Prod URL: https://evaluating-agent-rh.netlify.app

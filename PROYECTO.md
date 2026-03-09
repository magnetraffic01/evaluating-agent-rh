# MAGNETRAFFIC HR — Bitácora del Proyecto

> Registro completo de implementación, errores, soluciones y configuraciones.
> Actualizar en cada sesión de trabajo.

---

## 📋 DATOS DEL PROYECTO

| Campo | Valor |
|-------|-------|
| Proyecto | Magnetraffic HR Evaluator |
| Dueño | Amed — integracion@magnetraffic.com |
| Repo local | `/magnetraffic-evaluator-main/` |
| Supabase proyecto | `magnetraffic-rh` |
| Supabase Project ID | `oeqqhsrwhxmwoxtluflf` |
| Supabase URL | `https://oeqqhsrwhxmwoxtluflf.supabase.co` |
| Deploy target | Netlify |
| URL producción | https://evaluating-agent-rh.netlify.app |
| Repo GitHub | https://github.com/Mario24874/evaluating-agent-hr |
| Fecha inicio | 2026-03-09 |

---

## 🗂️ ESTRUCTURA DEL PROYECTO (generada por Lovable)

```
src/
├── components/
│   ├── steps/          ← 14 componentes de evaluación
│   ├── ui/             ← shadcn/ui (NO modificar)
│   ├── MagnetLogo.tsx
│   ├── NavLink.tsx
│   └── StepRenderer.tsx
├── pages/
│   ├── Evaluate.tsx    ← Flujo principal de evaluación
│   ├── Result.tsx      ← Pantalla de resultado
│   ├── Admin.tsx       ← Dashboard admin
│   ├── Expired.tsx     ← Sesión expirada
│   ├── Index.tsx
│   └── NotFound.tsx
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── supabase.ts     ← Cliente Supabase (creado en Sesión 1)
│   └── utils.ts
├── utils/
│   └── scoring.ts      ← Lógica de scoring (generada por Lovable)
└── types/
    └── evaluation.ts   ← Tipos TypeScript
```

---

## 🔑 CREDENCIALES Y ACCESOS

> ⚠️ No compartir estas credenciales públicamente

| Recurso | Detalle |
|---------|---------|
| Supabase anon key | Ver `.env.production` |
| Supabase service key | Ver `.env.production` |
| Admin dashboard URL | `/admin` |
| Admin password | Ver `.env.production` |
| Calendar Elite | `https://crm.yainsurance.us/widget/bookings/closer-entrevistas` |
| Calendar Calificado | `https://link.magnetraffic.com/widget/bookings/entrevista-para-closer` |

---

## 📦 DEPENDENCIAS INSTALADAS

### En el proyecto original (Lovable)
- react 18.3.1
- react-router-dom 6.30.1
- framer-motion 12.35.0
- tailwindcss 3.4.17
- shadcn/ui (radix-ui)
- sonner 1.7.4 (toasts)
- react-hook-form 7.61.1
- zod 3.25.76
- @tanstack/react-query 5.83.0
- lucide-react 0.462.0
- date-fns 3.6.0

### Instaladas en Sesión 1
```bash
npm install @supabase/supabase-js
# Resultado: 574 paquetes agregados, exit code 0
```

---

## 🗄️ BASE DE DATOS SUPABASE

### Tablas creadas

#### `evaluations`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Auto-generado |
| session_id | UUID UNIQUE | Identificador de sesión del candidato |
| created_at | TIMESTAMPTZ | Fecha de inicio |
| completed_at | TIMESTAMPTZ | Fecha de finalización |
| name | TEXT | Nombre del candidato |
| phone | TEXT | Teléfono |
| email | TEXT | Email (capturado en step 12) |
| age | INTEGER | Edad |
| location | TEXT | Ubicación |
| marital_status | TEXT | Estado civil |
| daily_calls | INTEGER | Llamadas diarias (usado en trampa V1) |
| last_income | NUMERIC | Último ingreso en comisiones |
| exit_reason | TEXT | Razón de salida del último trabajo |
| highlight | TEXT | Mejor respuesta de reactivación |
| cv_url | TEXT | URL del CV o LinkedIn |
| linkedin_url | TEXT | URL de LinkedIn |
| score_total | INTEGER | Puntaje total calculado |
| score_breakdown | JSONB | Desglose por categoría |
| flags | JSONB | Flags de evaluación |
| status | TEXT | en_progreso / elite / calificado / potencial / descartado |
| disqualify_reason | TEXT | Razón de descarte |
| current_step | INTEGER | Último paso completado |
| abandon_detected | BOOLEAN | Si detectó abandono |
| last_activity | TIMESTAMPTZ | Última actividad (para timeout 60min) |
| ip_address | TEXT | IP del candidato |
| user_agent | TEXT | User agent del navegador |

#### `admin_sessions`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | Auto-generado |
| created_at | TIMESTAMPTZ | Fecha de creación |
| expires_at | TIMESTAMPTZ | Fecha de expiración |

### Storage Bucket
| Bucket | Tipo | Ruta de archivos |
|--------|------|-----------------|
| `cvs` | Privado | `{session_id}/{filename}` |

### RLS Policies
| Tabla | Operación | Política |
|-------|-----------|----------|
| evaluations | INSERT | Público (candidatos) |
| evaluations | UPDATE | Público (candidatos continúan sesión) |
| evaluations | SELECT | Solo service_role (admin) |
| admin_sessions | ALL | Solo service_role |
| storage.objects (cvs) | INSERT | Público (candidatos suben CV) |
| storage.objects (cvs) | SELECT | Solo service_role |

---

## 📝 VARIABLES DE ENTORNO

### Archivos
| Archivo | Uso | ¿En git? |
|---------|-----|----------|
| `.env.local` | Desarrollo local | ❌ No |
| `.env.production` | Referencia para Netlify | ❌ No |
| `.env.example` | Plantilla (sin valores) | ✅ Sí |

### Variables requeridas
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_KEY
VITE_ADMIN_PASSWORD
VITE_CALENDAR_ELITE
VITE_CALENDAR_STD
VITE_GHL_WEBHOOK_URL       ← Pendiente (Sesión 5)
```

### Cómo cargar en Netlify
> Netlify Dashboard → Site settings → Environment variables
> Copiar los valores de `.env.production` uno a uno
> (Netlify no lee el archivo directamente del repo)

---

## 🚀 SESIONES DE TRABAJO

### ✅ Sesión 1 — Infraestructura base (2026-03-09)
**Objetivo:** Conectar Supabase, crear tablas, configurar entorno

**Completado:**
- [x] Creado proyecto Supabase `magnetraffic-rh`
- [x] Instalado `@supabase/supabase-js`
- [x] Creado `src/lib/supabase.ts` (cliente público + admin)
- [x] Creado `.env.local` con todas las variables
- [x] Creado `.env.production` para referencia Netlify
- [x] Creado `.env.example` (seguro para git)
- [x] Actualizado `.gitignore`
- [x] Creado `supabase-schema.sql`
- [ ] **PENDIENTE:** Ejecutar SQL en Supabase dashboard

**Archivos creados/modificados:**
- `src/lib/supabase.ts` ← NUEVO
- `.env.local` ← NUEVO
- `.env.production` ← NUEVO
- `.env.example` ← NUEVO
- `supabase-schema.sql` ← NUEVO
- `.gitignore` ← MODIFICADO

---

### ✅ Sesión 2 — Persistencia real (2026-03-09)
**Objetivo:** Migrar de localStorage a Supabase

**Completado:**
- [x] Creado `src/hooks/useSession.ts` (syncToSupabase, completeInSupabase)
- [x] Modificado `Evaluate.tsx` — upsert a Supabase en cada paso
- [x] Reanudación desde localStorage (cache local, mismo navegador)
- [x] Supabase como destino admin (write-only desde anon client)
- [x] Timeout 60min — redirige a `/expired` si sesión expirada
- [x] Anti-retroceso del navegador implementado (popstate handler)
- [x] Toast de error con opción "Reintentar" en paso final
- [x] Build de producción exitoso (2124 módulos, sin errores TS)

**Estrategia de persistencia:**
- localStorage = cache de estado completo (para reanudación rápida)
- Supabase = fuente de verdad para el admin dashboard
- Paso normal → syncToSupabase() fire-and-forget (no bloquea UI)
- Paso final/descarte → completeInSupabase() awaited (garantiza guardado)

**Archivos creados/modificados:**
- `src/hooks/useSession.ts` ← NUEVO
- `src/pages/Evaluate.tsx` ← MODIFICADO (persistencia + anti-retroceso + timeout)

---

### ✅ Sesión 3 — Admin + UI visual completo (2026-03-09)
**Objetivo:** Admin con Supabase + logo real + efectos visuales

**Completado:**
- [x] Creado `src/hooks/useAdmin.ts` (fetch de Supabase con service role)
- [x] Reescrito `Admin.tsx` — datos desde Supabase, no localStorage
- [x] Password admin desde `VITE_ADMIN_PASSWORD` (env var)
- [x] Sesión admin persistida en `sessionStorage`
- [x] Animated stat counters (count-up effect)
- [x] Staggered table rows con Framer Motion
- [x] Score breakdown con barras animadas
- [x] Modal de detalle mejorado (flags, razón de salida, highlight, CV)
- [x] `MagnetLogo.tsx` — usa `LogoMagnetraffic.png` real
- [x] Favicon → `MagnetrafficIcono.png` (reemplaza Lovable)
- [x] `index.css` — efectos ScrollXUI: shimmer-btn, glow-card-gold, float-anim, particle burst, spotlight-card
- [x] `Result.tsx` — reescrito con animaciones secuenciales, particle burst en Elite, radial glow por status
- [x] Build producción exitoso (675 KB, sin errores TS)

**Efectos aplicados (ScrollXUI vía Framer Motion):**
- `shimmer-btn` — sweep de luz en botones primarios
- `glow-card-gold` — borde dorado animado para card Elite
- `float-anim` — ícono flotante en resultado Elite
- `particle burst` — explosión de partículas doradas en resultado Elite
- `spotlight-card` — hover lift en cards del admin
- `AnimatedCounter` — contador animado para estadísticas
- `RevealText` — reveal secuencial de contenido en resultados

**Archivos creados/modificados:**
- `src/hooks/useAdmin.ts` ← NUEVO
- `src/pages/Admin.tsx` ← REESCRITO
- `src/pages/Result.tsx` ← REESCRITO
- `src/components/MagnetLogo.tsx` ← MODIFICADO (logo real)
- `src/index.css` ← MODIFICADO (efectos visuales)
- `index.html` ← MODIFICADO (favicon Magnetraffic)

---

### ✅ Sesión 4 — CV y Supabase Storage (2026-03-09)
**Objetivo:** Subida real de archivos CV al bucket privado de Supabase

**Completado:**
- [x] Creado `src/lib/storage.ts` (uploadCV, validateFile)
- [x] Reescrito `CVStep.tsx` — dos tabs: URL LinkedIn | Subir archivo
- [x] Drag & drop de archivos con zona visual
- [x] Barra de progreso animada durante el upload
- [x] Validación: PDF, DOC, DOCX, JPG, PNG, WEBP · máx 5 MB
- [x] URL firmada (1 año) generada post-upload via supabaseAdmin
- [x] Estado de éxito con opción de cambiar archivo
- [x] Lógica de 2 intentos antes de descarte (sin_cv)
- [x] Admin.tsx — componente CVLinks genera URL firmada (1h) al ver detalle
- [x] StepRenderer.tsx — pasa sessionId a CVStep
- [x] Build producción exitoso, sin errores TypeScript

**Flujo de un CV subido:**
1. Candidato sube archivo → `supabase.storage.upload('cvs/{sessionId}/{timestamp}-{file}')`
2. `supabaseAdmin.storage.createSignedUrl()` genera URL firmada 1 año
3. URL firmada se guarda en `evaluations.cv_url`
4. Admin ve el CV → `CVLinks` genera nueva URL firmada de 1h en tiempo real

**Archivos creados/modificados:**
- `src/lib/storage.ts` ← NUEVO
- `src/components/steps/CVStep.tsx` ← REESCRITO
- `src/components/StepRenderer.tsx` ← MODIFICADO (pasa sessionId)
- `src/pages/Admin.tsx` ← MODIFICADO (CVLinks component)

### ✅ Sesión 5 — Webhook GoHighLevel (2026-03-09)
**Objetivo:** Notificar a GHL al completar cada evaluación

**Completado:**
- [x] Creado `src/lib/webhook.ts`
- [x] Función `sendWebhook(state)` — fire and forget, nunca bloquea al candidato
- [x] Disparado en descarte (`handleDisqualify`) y en finalización (`case 13`)
- [x] Solo activo si `VITE_GHL_WEBHOOK_URL` está configurado
- [x] En DEV: log del payload en consola; en producción: silencioso
- [x] TypeScript OK, sin errores

**Payload enviado a GHL:**
```json
{
  "name": "Juan Pérez",
  "phone": "5215512345678",
  "email": "juan@email.com",
  "status": "elite|calificado|potencial|descartado",
  "score": 115,
  "calendar_link": "https://...",
  "session_id": "uuid",
  "completed_at": "ISO timestamp",
  "disqualify_reason": null,
  "location": "CDMX",
  "cv_url": "https://..."
}
```

**Para activar:** Agregar la URL del webhook de GHL en `.env.local` y `.env.production`:
```
VITE_GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/...
```

**Archivos creados/modificados:**
- `src/lib/webhook.ts` ← NUEVO
- `src/pages/Evaluate.tsx` ← MODIFICADO (sendWebhook en 2 puntos)

### ⏳ Sesión 6 — Refactor y limpieza (PENDIENTE)
**Objetivo:** Alinear estructura con CLAUDE.md

**Tareas:**
- [ ] Extraer lógica a `src/hooks/useScoring.ts`
- [ ] Crear `src/constants/scoring.ts`, `questions.ts`, `links.ts`
- [ ] Reemplazar logo Lucide por `public/logo.png` (si Amed provee el archivo)

---

### ⏳ Sesión 7 — QA + Deploy Netlify (PENDIENTE)
**Objetivo:** Producción lista

**Tareas:**
- [ ] Testing mobile: 320px, 375px, 414px
- [ ] Verificar anti-retroceso del navegador
- [ ] Conectar repo a Netlify
- [ ] Cargar env variables en Netlify dashboard
- [ ] Test end-to-end del flujo completo
- [ ] Verificar links de calendario GHL

---

## 🔮 DECISIONES Y PRÓXIMOS PASOS

> Consultas resueltas y decisiones tomadas — pendientes de implementar.

---

### 📌 DECISIÓN 1 — Rediseño del flujo n8n

**Contexto:**
El flujo actual de n8n conduce la evaluación completa de 16 turnos por WhatsApp. Con la app web implementada, n8n se simplifica a una pre-calificación rápida de 3-4 turnos.

**Flujo nuevo decidido:**
```
WhatsApp → n8n (pre-cal 3-4 turnos)
  0B: Saludo + consentimiento
  F1: País + disponibilidad full time
  F2: ¿Ventas telefónicas/video?
    ✅ Pasa → Alex envía link personalizado de la app
    ❌ No pasa → Descarte educado
App → Evaluación completa (14 pasos con scoring)
App → Webhook resultado → GHL
```

**Filtros de pre-calificación (solo 4):**
1. Consentimiento (0B)
2. LATAM o España + disponibilidad full time (F1)
3. Experiencia en ventas telefónicas/video (F2)
4. Manejo de herramientas digitales (F2)

**Link que Alex envía al candidato:**
```
https://evaluating-agent-rh.netlify.app/evaluate?name=Juan%20Pérez&phone=5215512345678
```

**Qué cambia en n8n:**
| Nodo | Cambio |
|------|--------|
| AI Agent — system prompt | Reemplazar con ALEX PRE-CAL v1.0 (3-4 turnos) |
| Code in JavaScript | Simplificar — sin scoring, solo pass/fail + construir app link |
| Pre-Proceso | Simplificar — no necesita leer campos de score |
| Resto de nodos | Sin cambios |

**⚠️ PENDIENTE:** Hacer el deploy a Netlify primero para tener la URL de producción. El JSON de n8n se entregará con la URL real ya incluida para importar una sola vez.

**Webhook de resultado (app → GHL):**
- La app ya envía el webhook al finalizar (Sesión 5 implementada)
- Falta crear un segundo flujo en n8n (o un Workflow en GHL) que reciba ese webhook y actualice el contacto con el resultado final (elite/calificado/potencial/descartado)
- URL del webhook se configura en `VITE_GHL_WEBHOOK_URL`

---

### 📌 DECISIÓN 2 — IA para scoring de texto libre

**Contexto:**
La app actual evalúa las respuestas de texto libre (E3, E4, E5) con regex de palabras clave. Esto se puede engañar con palabras clave sin contexto real.

**Decisión tomada:** Agregar IA **solo para los 3 pasos de texto libre** — no reemplazar el flujo completo.

| Paso | Campo | Evaluación actual | Con IA |
|------|-------|------------------|--------|
| E3 (Step 5) | Mensaje de reactivación | Regex de gancho/urgencia | Evalúa intención, tono, originalidad |
| E4 (Step 6) | Manejo de objeciones | Detecta si ofrece descuento | Evalúa calidad del argumento completo |
| E5 (Step 7) | Autonomía y autogestión | Busca "sistema", "herramientas" | Distingue sistema real vs. respuesta genérica |

**Arquitectura decidida:**
- Supabase Edge Function como proxy (la API key nunca queda expuesta en el frontend)
- El frontend llama a la Edge Function con la respuesta del candidato
- La Edge Function llama a Claude/GPT y retorna un score + razón
- El score se integra al sistema de scoring existente

**Impacto en el flujo:** Mínimo — solo se reemplaza la función de scoring en 3 steps. El resto del flujo (pasos, UI, Supabase, webhook) no cambia.

**⚠️ PENDIENTE:** Implementar después del deploy y pruebas iniciales. Requiere:
- Cuenta de Anthropic/OpenAI con créditos
- Crear Supabase Edge Function
- Modificar `src/utils/scoring.ts` en los 3 steps afectados

---

### 📌 DECISIÓN 3 — Deploy y migración de repo

**Flujo de deploy decidido:**

**Fase 1 — Hoy (cuenta personal):**
1. Crear repo en GitHub personal
2. Conectar a Netlify con cuenta personal
3. Configurar env variables en Netlify
4. URL de producción disponible para n8n y pruebas

**Fase 2 — Cuando se migre a la empresa:**
- **Opción A (recomendada):** Transferir repo en GitHub
  > Repo → Settings → Danger Zone → Transfer repository → cuenta de la empresa
  > Luego en Netlify: Site settings → Link to a different repository
- **Opción B:** Solo reconectar Netlify sin mover el repo
  > Netlify → Site settings → Build & deploy → Disconnect → Connect → cuenta empresa
- **Opción C (VPS directo):**
  ```bash
  npm run build   # genera dist/
  # Subir dist/ al VPS, servir con Nginx o Apache
  # No necesita Node.js corriendo — es sitio estático
  ```

**Sin lock-in:** Cualquiera de las 3 opciones es válida en cualquier momento sin perder historial ni configuración.

---

### 📌 DECISIÓN 4 — Orden de implementación post-deploy

Una vez desplegado en Netlify:

| Prioridad | Tarea | Estimado |
|-----------|-------|---------|
| 1 | Entregar n8n JSON rediseñado con URL de producción | 30 min |
| 2 | Configurar `VITE_GHL_WEBHOOK_URL` en Netlify | 10 min |
| 3 | Crear flujo receptor del webhook de resultado en n8n/GHL | 30 min |
| 4 | Prueba end-to-end: WhatsApp → pre-cal → app → resultado → GHL | 30 min |
| 5 | Implementar IA para scoring E3, E4, E5 (Sesión extra) | 90 min |

---

## 🐛 ERRORES Y SOLUCIONES

> Registrar aquí cada error encontrado y su solución

| Fecha | Error | Causa | Solución |
|-------|-------|-------|----------|
| — | — | — | — |

---

## 💻 COMANDOS ÚTILES

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Tests
npm run test

# Verificar tipos TypeScript
npx tsc --noEmit

# Instalar dependencia nueva
npm install [paquete]
```

---

## 🔗 LINKS ÚTILES

| Recurso | URL |
|---------|-----|
| Supabase Dashboard | https://supabase.com/dashboard/project/oeqqhsrwhxmwoxtluflf |
| Supabase SQL Editor | https://supabase.com/dashboard/project/oeqqhsrwhxmwoxtluflf/sql/new |
| Supabase Storage | https://supabase.com/dashboard/project/oeqqhsrwhxmwoxtluflf/storage/buckets |
| Netlify Dashboard | https://app.netlify.com |
| App en producción | https://evaluating-agent-rh.netlify.app |
| App — evaluación test | https://evaluating-agent-rh.netlify.app/evaluate?name=Juan&phone=5215512345678 |
| GHL Calendar Elite | https://crm.yainsurance.us/widget/bookings/closer-entrevistas |
| GHL Calendar Estándar | https://link.magnetraffic.com/widget/bookings/entrevista-para-closer |

---

## 📐 SISTEMA DE SCORING (referencia rápida)

| Categoría | Clave | Máx pts | Descarte |
|-----------|-------|---------|---------|
| Cierre directo | E1_cierre | 25 | sin_cierre_directo |
| Volumen llamadas | E1_volumen | 25 | — |
| Copywriting | E3_copywriting | 20 | sin_copywriting |
| Objeciones | E4_objeciones | 20 | sin_objeciones |
| Autonomía | E5_autonomia | 15 | — |
| Filosofía | E6_filosofia | 20 | — |
| Estabilidad | C1_estabilidad | 10 | — |
| Penalización V1 | V1_penalty | -10 | — |
| Penalización E2 | E2_penalty | -8 | — |

**Umbrales:**
- Elite ≥ 110 pts → Calendario crm.yainsurance.us
- Calificado 80-109 pts → Calendario link.magnetraffic.com
- Potencial 55-79 pts → Contacto manual 48h
- Descartado < 55 pts o descarte obligatorio → Mensaje cierre

# CLAUDE.md — Magnetraffic HR
> Este archivo es leído automáticamente por Claude Code en cada sesión.
> Contiene todo el contexto del proyecto para trabajar sin repetir instrucciones.

---

## 🏢 CONTEXTO DEL PROYECTO

**Nombre:** Magnetraffic HR
**Tipo:** Web App de calificación de candidatos para closer comercial remoto
**Empresa:** Magnetraffic (agencia de automatización y marketing)
**Dueño del proyecto:** Amed (integracion@magnetraffic.com)

### ¿Qué hace esta app?
1. Recibe candidatos pre-calificados desde GoHighLevel (GHL) vía WhatsApp
2. El candidato llega a la app con su nombre y teléfono en la URL: `/evaluate?name=XXX&phone=XXX`
3. La app conduce una evaluación estructurada de 14 pasos
4. Al finalizar, según el score, redirige al candidato a un calendario de GHL para agendar entrevista (o muestra mensaje de descarte)

### Flujo completo
```
WhatsApp (GHL) → Link con parámetros → App Web → Evaluación 14 pasos
→ Score calculado → Elite/Calificado: Link calendario GHL
                  → Potencial: "Te contactamos en 48h"
                  → Descartado: Mensaje de cierre
```

---

## 🎨 DISEÑO Y MARCA

### Colores (usar SIEMPRE estos valores exactos)
```css
--bg-primary:     #0A0A0A   /* Fondo principal */
--bg-secondary:   #111111   /* Fondo secundario */
--bg-card:        #1A1A1A   /* Cards/modales */
--gold-primary:   #D4AF37   /* Dorado principal */
--gold-light:     #F0C040   /* Dorado claro / hover */
--gold-dark:      #B8960C   /* Dorado oscuro / pressed */
--silver:         #C0C0C0   /* Plata (acentos) */
--silver-light:   #E8E8E8   /* Texto secundario claro */
--text-primary:   #FFFFFF   /* Texto principal */
--text-secondary: #A0A0A0   /* Texto secundario */
--success:        #22C55E   /* Verde éxito */
--warning:        #F59E0B   /* Amarillo advertencia */
--error:          #EF4444   /* Rojo error */
--border-gold:    rgba(212, 175, 55, 0.2)  /* Borde cards */
```

### Reglas de diseño
- **NUNCA** fondos blancos — todo es dark UI
- Glassmorphism: `bg-white/5 backdrop-blur-sm border border-gold/20`
- Cards con `rounded-xl`, botones primarios con `rounded-full`
- Sombras con tinte dorado en elementos activos
- Logo: "Magnetraffic" en blanco + "HR" en dorado `#D4AF37`
- Fuente: Inter (Google Fonts)

### Logo
- Archivo: `public/logo.png` (o similar según lo que generó Lovable)
- Usar en header de TODAS las pantallas
- Tamaño header: h-8 (32px)

---

## 🛠️ TECH STACK

```
Frontend:  React 18 + TypeScript
Styling:   Tailwind CSS + shadcn/ui
Animación: Framer Motion
Backend:   Supabase (DB + Storage + Auth)
Router:    React Router v6
Build:     Vite
Deploy:    Vercel / Netlify
```

### Convenciones de código
- TypeScript estricto — NO usar `any`
- Componentes funcionales con hooks
- Exportaciones nombradas para componentes, default para páginas
- Archivos de componentes: PascalCase (`QuestionCard.tsx`)
- Hooks custom: camelCase con prefijo `use` (`useEvaluation.ts`)
- Tipos/interfaces en `/src/types/`
- Constantes en `/src/constants/`
- Lógica de negocio separada de UI (custom hooks)

---

## 📁 ESTRUCTURA DE ARCHIVOS ESPERADA

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (NO modificar)
│   ├── evaluation/      # Componentes del flujo de evaluación
│   │   ├── QuestionCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StepConsent.tsx
│   │   ├── StepBasicInfo.tsx
│   │   ├── StepSalesExperience.tsx
│   │   ├── StepClosingRole.tsx
│   │   ├── StepIncomeHistory.tsx
│   │   ├── StepReactivation.tsx
│   │   ├── StepObjections.tsx
│   │   ├── StepAutonomy.tsx
│   │   ├── StepPhilosophy.tsx
│   │   ├── StepConsistency.tsx
│   │   ├── StepJobStability.tsx
│   │   ├── StepFinancial.tsx
│   │   ├── StepPreRegister.tsx
│   │   └── StepCV.tsx
│   ├── result/          # Pantallas de resultado
│   │   ├── ResultElite.tsx
│   │   ├── ResultCalificado.tsx
│   │   ├── ResultPotencial.tsx
│   │   └── ResultDescartado.tsx
│   ├── admin/           # Dashboard admin
│   └── shared/          # Header, Footer, Spinner, etc.
├── hooks/
│   ├── useEvaluation.ts    # Estado central de la evaluación
│   ├── useScoring.ts       # Lógica de puntuación
│   ├── useSession.ts       # Manejo de sesión y persistencia
│   └── useAdmin.ts         # Lógica del dashboard admin
├── pages/
│   ├── EvaluatePage.tsx    # /evaluate?name=X&phone=X
│   ├── ResultPage.tsx      # /result/:sessionId
│   ├── AdminPage.tsx       # /admin
│   └── ExpiredPage.tsx     # /expired
├── types/
│   ├── evaluation.ts       # Tipos del proceso de evaluación
│   ├── candidate.ts        # Tipo CandidateData
│   └── scoring.ts          # Tipos del sistema de scoring
├── constants/
│   ├── scoring.ts          # SCORE_CONFIG, THRESHOLDS, DISQUALIFIERS
│   ├── questions.ts        # Textos de preguntas y opciones
│   └── links.ts            # URLs de calendarios GHL
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   ├── scoring.ts          # Funciones de cálculo de score
│   └── utils.ts            # Helpers generales
└── styles/
    └── globals.css         # Variables CSS y estilos base
```

---

## 🗄️ BASE DE DATOS SUPABASE

### Tabla: `evaluations`
```sql
CREATE TABLE evaluations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  -- Datos del candidato
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  age             INTEGER,
  location        TEXT,
  marital_status  TEXT,
  daily_calls     INTEGER,
  last_income     NUMERIC,
  exit_reason     TEXT,
  highlight       TEXT,
  cv_url          TEXT,
  linkedin_url    TEXT,
  -- Scoring
  score_total     INTEGER DEFAULT 0,
  score_breakdown JSONB DEFAULT '{}',
  flags           JSONB DEFAULT '{}',
  -- Estado
  status          TEXT DEFAULT 'en_progreso',
  disqualify_reason TEXT,
  current_block   TEXT DEFAULT '0B',
  turn_count      INTEGER DEFAULT 1,
  current_step    INTEGER DEFAULT 0,
  -- Meta
  abandon_detected BOOLEAN DEFAULT FALSE,
  last_activity   TIMESTAMPTZ DEFAULT NOW(),
  ip_address      TEXT,
  user_agent      TEXT
);

-- RLS: Solo lectura pública para insertar, admin para leer todo
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert" ON evaluations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update own session" ON evaluations
  FOR UPDATE USING (true);

CREATE POLICY "Service role reads all" ON evaluations
  FOR SELECT USING (auth.role() = 'service_role');
```

### Tabla: `admin_sessions`
```sql
CREATE TABLE admin_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

### Storage bucket: `cvs`
- Bucket público: NO (privado)
- Archivos: `{session_id}/{filename}`
- Tipos permitidos: pdf, doc, docx, jpg, png, webp

---

## 🧮 SISTEMA DE SCORING

### Puntos por bloque
```typescript
export const SCORE_CONFIG = {
  E1_cierre: {
    'cierra_y_cobra': 25,
    'apoyo_cierre': 15,
    'solo_demos': 5,
    'sin_cierre': 0,        // → DESCARTE OBLIGATORIO
  },
  E1_volumen: {
    'mas_40': 25,
    'entre_20_39': 18,
    'entre_10_19': 10,
    'menos_10': 0,
  },
  E3_copywriting: {
    'gancho_urgencia': 20,  // → guardar en highlight
    'generico': 10,
    'no_sabe': 0,           // → DESCARTE OBLIGATORIO
  },
  E4_objeciones: {
    'redirige_pregunta': 20,
    'defiende_valor': 14,
    'generico': 7,
    'ofrece_descuento': 0,  // → DESCARTE OBLIGATORIO
  },
  E5_autonomia: {
    'sistema_propio': 15,
    'vago_dependiente': 0,  // → flag baja_ejecucion
  },
  E6_filosofia: {
    'precalificar_profundo': 20,
    'precalificar_basico': 12,
    'convertir_tecnica': 5,
    'convertir_sin_arg': 0,  // + penalty 10
  },
  C1_estabilidad: {
    '1_trabajo': 10,
    '2_trabajos': 10,
    '3_o_mas': 5,           // + flag riesgo_retencion
  },
  penalties: {
    V1_acepta_falso: -10,
    E2_narrativa_inconsistente: -8,
    E6_convertir_sin_arg: -10,
  }
} as const;

export const THRESHOLDS = {
  ELITE: 110,
  CALIFICADO: 80,
  POTENCIAL: 55,
} as const;

export const CALENDAR_LINKS = {
  ELITE: 'https://crm.yainsurance.us/widget/bookings/closer-entrevistas',
  CALIFICADO: 'https://link.magnetraffic.com/widget/bookings/entrevista-para-closer',
} as const;
```

### Descartes obligatorios (detienen el flujo inmediatamente)
```typescript
export const MANDATORY_DISQUALIFIERS = {
  rechazo_inicial: 'No consintió el proceso',
  sin_disponibilidad: 'Disponibilidad insuficiente',
  sin_herramientas_digitales: 'Sin manejo de herramientas digitales',
  sin_ventas_telefonicas: 'Sin experiencia en ventas telefónicas',
  sin_cierre_directo: 'Sin cierre directo en ventas',
  sin_copywriting: 'Sin habilidad de recuperación',
  sin_objeciones: 'Sin manejo de objeciones',
  sin_runway: 'Sin runway financiero mínimo',
  no_envio_cv: 'No envió CV',
  proceso_incompleto: 'Proceso incompleto',
} as const;
```

---

## 🔗 INTEGRACIONES EXTERNAS

### GoHighLevel (GHL)
- La app **recibe** candidatos de GHL via URL params
- La app **no llama** a GHL directamente (por ahora)
- Webhook futuro: `VITE_GHL_WEBHOOK_URL` (env variable)
- Payload del webhook al completar evaluación:
```json
{
  "name": "Juan Pérez",
  "phone": "5215512345678",
  "email": "juan@email.com",
  "status": "elite|calificado|potencial|descartado",
  "score": 115,
  "calendar_link": "https://...",
  "session_id": "uuid",
  "completed_at": "ISO timestamp"
}
```

### Calendarios GHL
- **Elite** (≥110 pts): `https://crm.yainsurance.us/widget/bookings/closer-entrevistas`
- **Calificado** (80-109 pts): `https://link.magnetraffic.com/widget/bookings/entrevista-para-closer`
- Se abren en nueva pestaña con `target="_blank"`

---

## ⚙️ VARIABLES DE ENTORNO

```env
# .env.local (NUNCA commitear al repo)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_SERVICE_KEY=   # Solo para admin
VITE_ADMIN_PASSWORD=
VITE_GHL_WEBHOOK_URL=
VITE_CALENDAR_ELITE=https://crm.yainsurance.us/widget/bookings/closer-entrevistas
VITE_CALENDAR_STD=https://link.magnetraffic.com/widget/bookings/entrevista-para-closer
```

---

## 🚦 REGLAS DE NEGOCIO CRÍTICAS

1. **Una sola dirección:** El candidato NO puede retroceder entre pasos
2. **Score oculto:** El score NUNCA se muestra al candidato en ningún paso
3. **Sesión única:** Una URL de evaluación = una sesión. Si se detecta doble acceso → warning
4. **Timeout:** 60 minutos de inactividad → sesión expirada → `/expired`
5. **Persistencia:** Cada respuesta se guarda en Supabase inmediatamente al hacer submit
6. **Reanudación:** Si el candidato recarga dentro de los 60 min → retoma desde el último paso guardado
7. **Anti-retroceso:** Desactivar el botón "atrás" del navegador con `history.pushState`
8. **V1 trampa:** En el step 10, mostrar EXACTAMENTE la mitad del valor capturado en daily_calls
9. **CV obligatorio:** Sin CV o LinkedIn → descarte automático (se solicita máx 2 veces)
10. **Mobile first:** La app debe funcionar perfectamente en celulares desde 320px

---

## 📱 UX/UI RULES

### Animaciones (Framer Motion)
```typescript
// Transición entre pasos — slide desde la derecha
const slideVariants = {
  enter: { x: '100%', opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
};

// Pantalla de resultado — fade + scale
const resultVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};
```

### Estados de loading
- Todo async → spinner dorado centrado
- Botones durante submit → texto "Guardando..." + spinner inline + disabled
- NO usar `alert()` — siempre usar toast (sonner o shadcn toast)

### Mensajes de error
- Validación inline debajo del campo (rojo `#EF4444`)
- Errores de red → toast con opción "Reintentar"

---

## 🔐 ADMIN DASHBOARD

- Ruta: `/admin`
- Autenticación: password simple almacenado en `VITE_ADMIN_PASSWORD`
- Sesión admin guardada en `sessionStorage` (expira al cerrar tab)
- NO usar Supabase Auth para el admin (demasiado complejo para este caso)
- Acceso directo a Supabase desde el cliente con service key para leer todos los registros

### Columnas de la tabla admin
| Campo | Descripción |
|-------|-------------|
| Nombre | name completo |
| Teléfono | phone |
| Email | email (si capturado) |
| Ubicación | location |
| Score | score_total con badge de color |
| Resultado | status con pill coloreado |
| Fecha | created_at formateado |
| Duración | completed_at - created_at en minutos |
| Acción | Botón "Ver detalle" |

---

## 🐛 DEBUGGING Y LOGS

- En desarrollo: loggear cada cambio de step y score al console
- En producción: NO logs de score al console (seguridad)
- Usar `import.meta.env.DEV` para condicionar logs
- Supabase errors → siempre capturar y mostrar al usuario (no silenciar)

---

## 📋 TAREAS PENDIENTES (actualizar según avance)

- [ ] Verificar estructura de archivos generada por Lovable
- [ ] Configurar variables de entorno en `.env.local`
- [ ] Conectar Supabase y verificar esquema de tablas
- [ ] Implementar lógica de scoring en `useScoring.ts`
- [ ] Implementar persistencia por sesión en Supabase
- [ ] Verificar flujo completo paso a paso
- [ ] Implementar timeout de sesión (60 min)
- [ ] Implementar anti-retroceso del navegador
- [ ] Configurar Storage bucket para CVs
- [ ] Conectar links de calendarios GHL
- [ ] Implementar webhook a GHL al completar
- [ ] Testing en mobile (320px, 375px, 414px)
- [ ] Deploy a Vercel/Netlify con env variables

---
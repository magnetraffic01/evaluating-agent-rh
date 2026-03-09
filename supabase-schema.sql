-- ============================================================
-- MAGNETRAFFIC HR — Schema SQL
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- TABLA PRINCIPAL: evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,

  -- Datos del candidato
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT,
  age               INTEGER,
  location          TEXT,
  marital_status    TEXT,
  daily_calls       INTEGER,
  last_income       NUMERIC,
  exit_reason       TEXT,
  highlight         TEXT,
  cv_url            TEXT,
  linkedin_url      TEXT,

  -- Scoring
  score_total       INTEGER DEFAULT 0,
  score_breakdown   JSONB DEFAULT '{}',
  flags             JSONB DEFAULT '{}',

  -- Estado
  status            TEXT DEFAULT 'en_progreso'
                      CHECK (status IN ('en_progreso','elite','calificado','potencial','descartado')),
  disqualify_reason TEXT,
  current_step      INTEGER DEFAULT 0,

  -- Meta
  abandon_detected  BOOLEAN DEFAULT FALSE,
  last_activity     TIMESTAMPTZ DEFAULT NOW(),
  ip_address        TEXT,
  user_agent        TEXT
);

-- TABLA: admin_sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar una evaluación (candidatos nuevos)
CREATE POLICY "Anyone can insert evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (true);

-- Cualquiera puede actualizar (candidato continúa su sesión)
CREATE POLICY "Anyone can update evaluations"
  ON evaluations FOR UPDATE
  USING (true);

-- Solo el service role puede leer (admin dashboard)
CREATE POLICY "Service role reads all evaluations"
  ON evaluations FOR SELECT
  USING (auth.role() = 'service_role');

-- Solo el service role maneja admin_sessions
CREATE POLICY "Service role manages admin_sessions"
  ON admin_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- STORAGE BUCKET: cvs
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Solo el service role puede leer archivos del bucket
CREATE POLICY "Service role reads cvs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs' AND auth.role() = 'service_role');

-- Cualquiera puede subir CVs (candidatos)
CREATE POLICY "Anyone can upload cvs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs');

-- ============================================================
-- ÍNDICES para performance del admin dashboard
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_evaluations_status
  ON evaluations (status);

CREATE INDEX IF NOT EXISTS idx_evaluations_created_at
  ON evaluations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evaluations_phone
  ON evaluations (phone);

-- ============================================================
-- FASE 2 — Admin authentication via Supabase Auth
-- Ejecutar 2026-04-19
-- ============================================================

-- Tabla admins: vincula auth.users con rol admin
CREATE TABLE IF NOT EXISTS admins (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Un admin ve solo su propio registro (para verificar rol en el cliente)
DROP POLICY IF EXISTS "Admin ve su propio registro" ON admins;
CREATE POLICY "Admin ve su propio registro" ON admins FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Helper: es el usuario actual un admin?
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
  LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
$$;

-- Policies nuevas para admins autenticados
-- evaluations: SELECT/UPDATE all
DROP POLICY IF EXISTS "admin_select_all_evaluations" ON evaluations;
CREATE POLICY "admin_select_all_evaluations" ON evaluations FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "admin_update_all_evaluations" ON evaluations;
CREATE POLICY "admin_update_all_evaluations" ON evaluations FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- recruiters: SELECT/INSERT/UPDATE por admin
DROP POLICY IF EXISTS "admin_select_recruiters" ON recruiters;
CREATE POLICY "admin_select_recruiters" ON recruiters FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "admin_insert_recruiters" ON recruiters;
CREATE POLICY "admin_insert_recruiters" ON recruiters FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_recruiters" ON recruiters;
CREATE POLICY "admin_update_recruiters" ON recruiters FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- storage: admin puede ver CVs
DROP POLICY IF EXISTS "admin_read_cvs" ON storage.objects;
CREATE POLICY "admin_read_cvs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cvs' AND is_admin());

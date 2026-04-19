DROP POLICY IF EXISTS "anon_select" ON evaluations;
DROP POLICY IF EXISTS "anon_update" ON evaluations;
DROP POLICY IF EXISTS "Anyone can update evaluations" ON evaluations;
DROP POLICY IF EXISTS "Anon puede actualizar reclutadores" ON recruiters;
DROP POLICY IF EXISTS "Anon puede insertar reclutadores" ON recruiters;
DROP POLICY IF EXISTS "Anon puede leer reclutadores" ON recruiters;
CREATE POLICY "anon_update_own_progress" ON evaluations FOR UPDATE TO anon USING (status = 'en_progreso') WITH CHECK (status = 'en_progreso');

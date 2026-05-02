import { test, expect } from '@playwright/test';

/**
 * Test E2E del flow Trebolife completo (11 pasos).
 * Verifica:
 * - Step 0 (Consent) se SALTA con ?company=trebolife
 * - Progress bar dice "Paso 1 de 11"
 * - LLM scoring funciona en steps 5/6/7
 * - Llega a /result con status correcto
 */

const PHONE = `+58414${(Date.now() % 100000).toString().padStart(5, '0')}`;
const NAME = 'PW Trebolife Test';

test('Flow Trebolife completo desde landing hasta result', async ({ page }) => {
  // 1. Limpiar localStorage para sesión limpia
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

  // 2. Navegar al link Trebolife
  const url = `/evaluate?company=trebolife&name=${encodeURIComponent(NAME)}&phone=${encodeURIComponent(PHONE)}`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  // 3. Verificar: NO ver el step 0 (Consent), debe estar en BasicInfo (step 1)
  await expect(page.getByRole('heading', { name: /información básica/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).toContainText(/paso\s+1\s+de\s+11/i);

  // 4. Step 1: BasicInfo (Trebolife: location + email + 40h+)
  await page.locator('input[type="text"]').first().fill('Caracas, Venezuela');
  await page.locator('input[type="email"]').fill('pw-trebolife@example.com');
  await page.locator('input[value="more_40"]').click({ force: true });
  await page.getByRole('button', { name: /continuar/i }).click();

  // 5. Step 2: Experience
  await expect(page.getByRole('heading', { name: /experiencia/i })).toBeVisible();
  await page.locator('textarea').fill(
    'Cerré seguros de salud por 3 años, suscripciones recurrentes con cliente promedio de 14 meses sin cancelar.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();

  // 6. Step 3: Closing role + volume
  await expect(page.getByRole('heading', { name: /rol/i })).toBeVisible();
  await page.locator('input[value="closer_direct"]').click({ force: true });
  await page.locator('input[value="40_plus"]').click({ force: true });
  await page.getByRole('button', { name: /continuar/i }).click();

  // 7. Step 4: Income
  await expect(page.getByRole('heading', { name: /historial/i })).toBeVisible();
  await page.locator('input[type="number"]').fill('2500');
  await page.locator('textarea').fill(
    'La empresa cerró su división de seguros hispanos. Estuve 2.5 años. Decidí buscar más estabilidad.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();

  // 8. Step 5: Reactivation (LLM Haiku ~8s)
  await expect(page.getByRole('heading', { name: /reactivación/i })).toBeVisible();
  await page.locator('textarea').fill(
    'Hola María, vi que pediste info hace 3 semanas sobre el plan dental familiar. Cierran inscripciones esta semana con bono que vence el viernes. ¿Te lo aparto antes que se acaben los 5 cupos?'
  );
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.waitForTimeout(10_000); // LLM scoring

  // 9. Step 6: Objection (LLM)
  await expect(page.getByRole('heading', { name: /objeci/i })).toBeVisible({ timeout: 15_000 });
  await page.locator('textarea').fill(
    'Te entiendo María. Obamacare cubre lo grande pero ¿has revisado el deductible para una limpieza dental? Trebolife te da $0 de copago.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.waitForTimeout(10_000); // LLM scoring

  // 10. Step 7: Autonomy (LLM)
  await expect(page.getByRole('heading', { name: /método/i })).toBeVisible({ timeout: 15_000 });
  await page.locator('textarea').fill(
    'Bloqueo 6-9am para prospección en HubSpot, 9-12 para llamadas. Uso Notion para journal de KPIs. Reviso pipeline cada lunes.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.waitForTimeout(10_000);

  // 11. Step 10: Stability (Trebolife salta 8 y 9)
  await expect(page.getByRole('heading', { name: /trayectoria/i })).toBeVisible({ timeout: 15_000 });
  await page.locator('input[value="1"]').click({ force: true });
  await page.getByRole('button', { name: /continuar/i }).click();

  // 12. Step 11: Ramp-up
  await expect(page.getByRole('heading', { name: /velocidad de arranque/i })).toBeVisible();
  await page.locator('input[value="week_1_2"]').click({ force: true });
  await page.getByRole('button', { name: /continuar/i }).click();

  // 13. Step 12: ChurnResistance (heading: "Cierre con FIT vs cierre con presión")
  await expect(page.getByRole('heading', { name: /fit|cierre/i })).toBeVisible();
  await page.locator('textarea').fill(
    'No le pregunté si ya tiene dentista de cabecera. Si María no usa el seguro porque no sabe a quién acudir, el problema es mío. La próxima vez voy a hacer mini-onboarding con link de búsqueda.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();

  // 14. Step 13: CV
  await expect(page.getByRole('heading', { name: /expediente/i })).toBeVisible();
  // Click en LinkedIn URL tab si existe
  const urlTab = page.getByRole('button', { name: /linkedin|url/i }).first();
  if (await urlTab.isVisible().catch(() => false)) await urlTab.click();
  await page.locator('input[type="url"], input[placeholder*="linkedin"]').fill(
    'https://linkedin.com/in/pw-trebolife-test'
  );
  await page.getByRole('button', { name: /finalizar/i }).click();

  // 15. Verificar resultado
  await page.waitForURL(/\/result\//, { timeout: 30_000 });
  expect(page.url()).toContain('/result/');

  // Verificar localStorage tiene status correcto
  const finalState = await page.evaluate((phone) => {
    const sid = localStorage.getItem(`eval_session_${phone}`);
    const data = sid ? JSON.parse(localStorage.getItem(`eval_${sid}`) || '{}') : {};
    return { status: data.status, score: data.totalScore, company: data.company, currentStep: data.currentStep };
  }, PHONE);

  expect(['elite', 'calificado']).toContain(finalState.status);
  expect(finalState.score).toBeGreaterThanOrEqual(80);
  expect(finalState.company).toBe('trebolife');
  expect(finalState.currentStep).toBe(13);
});

import { test, expect } from '@playwright/test';

/**
 * Test E2E del flow Traduce completo (12 pasos — FASE 10 agregó InboundOpen).
 * Verifica:
 * - Step 0 (Consent) se SALTA con ?company=traduce
 * - Progress bar dice "Paso 1 de 12"
 * - Preguntas Traduce-específicas en Experience, Reactivation, Autonomy
 * - Objection y ChurnResistance reusan el producto simulado "Bienestar Familiar"
 * - Llega a /result con status correcto
 */

const PHONE = `+58415${(Date.now() % 100000).toString().padStart(5, '0')}`;
const NAME = 'PW Traduce Test';

test('Flow Traduce completo desde landing hasta result', async ({ page }) => {
  // 1. Limpiar localStorage para sesión limpia
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

  // 2. Navegar al link Traduce
  const url = `/evaluate?company=traduce&name=${encodeURIComponent(NAME)}&phone=${encodeURIComponent(PHONE)}`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  // 3. Verificar: NO ver el step 0 (Consent), debe estar en BasicInfo (step 1)
  await expect(page.getByRole('heading', { name: /información básica/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).toContainText(/paso\s+1\s+de\s+12/i);

  // 4. Step 1: BasicInfo (Traduce FASE 10: location + email + 40h+ + idioma)
  await page.locator('input[type="text"]').first().fill('Miami, Florida, EE.UU.');
  await page.locator('input[type="email"]').fill('pw-traduce@example.com');
  await page.locator('input[value="more_40"]').click({ force: true });
  await page.locator('input[value="es_en"]').click({ force: true });
  await page.getByRole('button', { name: /continuar/i }).click();

  // 5. Step 2: Experience — verifica que el texto es Traduce-específico (USCIS / trámite / bundling)
  await expect(page.getByRole('heading', { name: /experiencia/i })).toBeVisible();
  // Verificar texto Traduce (menciona USCIS/trámite, no Trebolife/Obamacare)
  await expect(page.locator('body')).toContainText(/USCIS|trámite|migra/i);
  await page.locator('textarea').fill(
    'Trabajé 2 años vendiendo servicios legales a inmigrantes hispanos. Promedio 7 contactos antes de cerrar. Subía de 1 documento a paquete familiar con facilidad — explicaba el ahorro total vs precio unitario. Usé CRM para seguimiento.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();

  // 6. Step 3: Closing role + volume
  await expect(page.getByRole('heading', { name: /rol/i })).toBeVisible();
  await page.locator('input[value="closer_direct"]').click({ force: true });
  await page.locator('input[value="40_plus"]').click({ force: true });
  await page.getByRole('button', { name: /continuar/i }).click();

  // 7. Step 4: Income
  await expect(page.getByRole('heading', { name: /historial/i })).toBeVisible();
  await page.locator('input[type="number"]').fill('1800');
  await page.locator('textarea').fill(
    'La empresa se mudó a otra ciudad. Decidí quedarme en Miami. Estuve 2 años, buena experiencia.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();

  // 8. Step 5: Reactivation Traduce — verifica texto específico (cotización / 1 mes)
  await expect(page.getByRole('heading', { name: /reactivación/i })).toBeVisible();
  await expect(page.locator('body')).toContainText(/cotización|1 mes|mes/i);
  await page.locator('textarea').fill(
    'Hola Roberto, hace un mes me pediste cotización para los documentos de USCIS. Esta semana hay un bono de $15 para paquetes de 3+ páginas. ¿Arrancamos hoy para que lleguen antes de tu cita?'
  );
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.waitForTimeout(10_000); // LLM scoring

  // 9. Step 6: Objection — FASE 10: producto simulado "Bienestar Familiar / $29"
  await expect(page.getByRole('heading', { name: /objeci/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).toContainText(/Bienestar|Familiar|\$29/i);
  await page.locator('textarea').fill(
    'Te entiendo Roberto. Tu seguro principal cubre lo grande, pero ¿revisaste cuánto pagás de copago en una visita dental rutinaria? El servicio de $29 te baja eso a $0 — y aplica para toda la familia, no solo para vos.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.waitForTimeout(10_000); // LLM scoring

  // 10. Step 7: Autonomy Traduce — verifica texto (80 leads / CRM / pipeline)
  await expect(page.getByRole('heading', { name: /método/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).toContainText(/80|pipeline|CRM|lead/i);
  await page.locator('textarea').fill(
    'Uso HubSpot con etapas: cotizado, seguimiento 1, seguimiento 2, cierre. Cada mañana reviso los leads sin actividad en 3+ días. Tengo secuencia de 5 mensajes por tipo de trámite. Reviso KPIs cada viernes.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();
  await page.waitForTimeout(10_000);

  // 11. Step 8: InboundOpen (FASE 10 — nuevo)
  await expect(page.getByRole('heading', { name: /apertura.*inbound/i })).toBeVisible({ timeout: 15_000 });
  await page.locator('textarea').fill(
    'Hola, ¿hablo con Roberto? Soy del equipo de Bienestar Familiar — vi que dejaste tus datos online interesado en la membresía. Antes de explicarte los descuentos, contame: ¿buscás algo solo para vos o pensás incluir a tu familia? ¿hay algún gasto médico o dental que te haya sorprendido últimamente?'
  );
  await page.getByRole('button', { name: /continuar/i }).click();

  // 12. Step 10: Stability (Traduce salta 9 — verification)
  await expect(page.getByRole('heading', { name: /trayectoria/i })).toBeVisible({ timeout: 15_000 });
  await page.locator('input[value="1"]').click({ force: true });
  await page.getByRole('button', { name: /continuar/i }).click();

  // 13. Step 11: Financial (FASE 10 — combina runway + ramp-up)
  await expect(page.getByRole('heading', { name: /última pregunta|last question/i })).toBeVisible();
  await page.locator('input[value="stable"]').click({ force: true });
  // Tras "stable" aparece la sección de ramp-up con el copy de Traduce
  await expect(page.locator('body')).toContainText(/\$100|ticket|comisión/i);
  await page.locator('input[value="week_1_2"]').click({ force: true });
  await page.getByRole('button', { name: /continuar/i }).click();

  // 14. Step 12: ChurnResistance — FASE 10: reusa producto simulado
  await expect(page.getByRole('heading', { name: /fit|cierre/i })).toBeVisible();
  await expect(page.locator('body')).toContainText(/Bienestar|María|membresía/i);
  await page.locator('textarea').fill(
    'No le pregunté qué descuento iba a usar primero. Si María no tiene claro qué necesidad cubre el servicio en su día a día, no lo va a usar. La próxima vez mapeo con ella el primer ahorro concreto en los primeros 30 días.'
  );
  await page.getByRole('button', { name: /continuar/i }).click();

  // 14. Step 13: CV
  await expect(page.getByRole('heading', { name: /expediente/i })).toBeVisible();
  const urlTab = page.getByRole('button', { name: /linkedin|url/i }).first();
  if (await urlTab.isVisible().catch(() => false)) await urlTab.click();
  await page.locator('input[type="url"], input[placeholder*="linkedin"]').fill(
    'https://linkedin.com/in/pw-traduce-test'
  );
  await page.getByRole('button', { name: /finalizar/i }).click();

  // 15. Verificar resultado
  await page.waitForURL(/\/result\//, { timeout: 30_000 });
  expect(page.url()).toContain('/result/');

  // Verificar localStorage tiene status correcto y company = 'traduce'
  const finalState = await page.evaluate((phone) => {
    const sid = localStorage.getItem(`eval_session_${phone}`);
    const data = sid ? JSON.parse(localStorage.getItem(`eval_${sid}`) || '{}') : {};
    return {
      status: data.status,
      score: data.totalScore,
      company: data.company,
      currentStep: data.currentStep,
      assignedTo: data.assignedTo,
    };
  }, PHONE);

  expect(['elite', 'calificado']).toContain(finalState.status);
  expect(finalState.score).toBeGreaterThanOrEqual(80);
  expect(finalState.company).toBe('traduce');
  expect(finalState.currentStep).toBe(13);
});

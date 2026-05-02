import { test, expect } from '@playwright/test';

/**
 * Tests del admin y portal: login + tabs visibles + i18n.
 */

test('Admin login funciona y muestra las 4 tabs', async ({ page }) => {
  await page.goto('/admin');

  // Click "Acceder al Panel" si está visible
  const accederBtn = page.getByRole('button', { name: /acceder/i }).first();
  if (await accederBtn.isVisible().catch(() => false)) {
    await accederBtn.click();
    await page.waitForTimeout(800);
  }

  // Llenar email + password
  await page.locator('input[type="email"], input[type="text"]').first().fill('agarces@magnetraffic.com');
  await page.locator('input[type="password"]').fill('Info2026$$');

  // Submit (primer botón después del password)
  const loginBtn = page.locator('button').filter({ hasText: /iniciar|entrar|login|acceder/i }).last();
  await loginBtn.click();
  await page.waitForTimeout(3000);

  // Verificar que aparecen las 4 tabs
  await expect(page.locator('body')).toContainText(/candidatos/i);
  await expect(page.locator('body')).toContainText(/reclutadores/i);
  await expect(page.locator('body')).toContainText(/empresas/i);
  await expect(page.locator('body')).toContainText(/analytics/i);
});

test('Portal i18n: cambio ES → EN cambia textos', async ({ page }) => {
  await page.goto('/portal');
  await page.waitForLoadState('networkidle');

  // Click EN button
  const enBtn = page.getByRole('button', { name: /^en$/i }).first();
  if (await enBtn.isVisible().catch(() => false)) {
    await enBtn.click();
    await page.waitForTimeout(500);

    // En inglés debe aparecer "Sign in" o "Email" (no "Iniciar sesión")
    const bodyText = await page.locator('body').innerText();
    const hasEnglish = /sign in|email|password/i.test(bodyText);
    const hasOnlySpanish = /iniciar sesión/i.test(bodyText) && !hasEnglish;
    expect(hasOnlySpanish).toBeFalsy();
  }
});

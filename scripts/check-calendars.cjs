// Script para verificar el estado real de los calendar URLs de los reclutadores.
// Usa Playwright para pasar el Cloudflare challenge (cosa que curl no puede).
//
// Uso:
//   node scripts/check-calendars.js

const { chromium } = require('playwright');

const URLS = [
  {
    label: 'A) JULIANA — actual en BD (con -new)',
    url: 'https://link.magnetraffic.com/widget/bookings/presentacion-closer-new',
  },
  {
    label: 'B) JULIANA — fallback código (sin -new)',
    url: 'https://link.magnetraffic.com/widget/bookings/presentacion-closer',
  },
  {
    label: 'C) YEI — actual en BD',
    url: 'https://crm.yainsurance.us/widget/booking/t864CZCochB3mGSnKlOb',
  },
];

async function checkUrl(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  // Esperar al menos 5s para que Cloudflare challenge resuelva
  await page.waitForTimeout(5_000);

  const finalUrl = page.url();
  const title = await page.title().catch(() => null);

  const text = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
  const html = await page.content().catch(() => '');

  // Señales de error / éxito típicas en widgets GHL
  const lower = text.toLowerCase();
  const errorSignals = [
    'not found', 'no encontrado', '404',
    'invalid', 'inválido',
    'calendar not available', 'calendario no disponible',
    'expired', 'expirado',
    'this calendar is not active',
    'no longer available',
    'private',
  ];
  const successSignals = [
    'select a date', 'selecciona una fecha', 'select a time',
    'available', 'disponible',
    'book', 'agendar', 'agendá',
    'meeting', 'cita', 'entrevista',
    'next month', 'próximo mes', 'siguiente',
  ];

  const errors = errorSignals.filter(s => lower.includes(s));
  const successes = successSignals.filter(s => lower.includes(s));

  return {
    finalUrl,
    title,
    textPreview: text.slice(0, 600).replace(/\s+/g, ' '),
    htmlSize: html.length,
    errorSignals: errors,
    successSignals: successes,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  for (const { label, url } of URLS) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(label);
    console.log('URL:', url);
    console.log('═══════════════════════════════════════════════════════════');
    try {
      const r = await checkUrl(page, url);
      console.log('Final URL:', r.finalUrl);
      console.log('Page title:', r.title);
      console.log('HTML size:', r.htmlSize, 'bytes');
      console.log('Error signals found:', r.errorSignals.length ? r.errorSignals.join(', ') : '(none)');
      console.log('Success signals found:', r.successSignals.length ? r.successSignals.join(', ') : '(none)');
      console.log('Text preview (first 600 chars):');
      console.log('  ', r.textPreview);
    } catch (e) {
      console.log('ERROR:', e.message);
    }
  }

  await browser.close();
})();

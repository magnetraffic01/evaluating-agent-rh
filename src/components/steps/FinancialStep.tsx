import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Company } from '@/types/evaluation';

interface Props {
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
  company: Company;
}

/**
 * Doble propósito según `company`:
 *  - legacy / null: solo runway financiero (estable / necesita ya).
 *  - trebolife/traduce (FASE 10): combina ambas preguntas en una pantalla:
 *      1) Estabilidad financiera (estable | necesita ahora → descalifica)
 *      2) Tras "estable", aparece la pregunta de RAMP-UP.
 *    El submit envía AMBAS respuestas en el mismo payload.
 */
export default function FinancialStep({ onNext, onDisqualify, company }: Props) {
  const { t } = useLanguage();
  const [stability, setStability] = useState('');
  const [ramp, setRamp] = useState('');

  const isTrebolife = company === 'trebolife';
  const isTraduce = company === 'traduce';
  const isCombined = isTrebolife || isTraduce;

  const rampOptions = isTrebolife
    ? [
        { value: 'week_1_2',     label: t('ramp_week_1_2') },
        { value: 'week_3_4',     label: t('ramp_week_3_4') },
        { value: 'month_2',      label: t('ramp_month_2') },
        { value: 'month_3_plus', label: t('ramp_month_3_plus') },
      ]
    : isTraduce
      ? [
          { value: 'week_1_2',     label: t('ramp_week_1_2_traduce') },
          { value: 'week_3_4',     label: t('ramp_week_3_4_traduce') },
          { value: 'month_2',      label: t('ramp_month_2_traduce') },
          { value: 'month_3_plus', label: t('ramp_month_3_plus_traduce') },
        ]
      : [];

  const stabilityOptions = [
    { value: 'stable',     label: t('financial_stable') },
    { value: 'needs_now',  label: t('financial_needs_now') },
  ];

  const rampTitle = isTrebolife
    ? t('ramp_title')
    : isTraduce
      ? t('ramp_title_traduce')
      : '';
  const rampDescription = isTrebolife
    ? t('ramp_description')
    : isTraduce
      ? t('ramp_description_traduce')
      : '';

  // ─── Legacy flow (company === null) — solo runway ──────────────────────────
  if (!isCombined) {
    const handleLegacy = () => {
      if (stability === 'needs_now') {
        onDisqualify('sin_runway');
        return;
      }
      onNext({ financialSituation: stability });
    };

    return (
      <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-foreground mb-4">{t('financial_title')}</h2>
        <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
          {t('financial_description')}
        </p>

        <div className="space-y-2 mb-6">
          {stabilityOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                stability === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <input
                type="radio"
                name="financial"
                value={opt.value}
                checked={stability === opt.value}
                onChange={() => setStability(opt.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  stability === opt.value ? 'border-primary' : 'border-muted-foreground/40'
                }`}
              >
                {stability === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-foreground text-sm">{opt.label}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleLegacy}
          disabled={!stability}
          className="w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('continue')}
        </button>
      </div>
    );
  }

  // ─── Combined flow (trebolife/traduce) — runway → ramp-up ─────────────────
  const handleStabilityChange = (val: string) => {
    setStability(val);
    if (val === 'needs_now') {
      // Descalifica inmediatamente al elegir la opción problemática.
      onDisqualify('sin_runway');
    }
  };

  const handleSubmit = () => {
    if (stability !== 'stable' || !ramp) return;
    onNext({ financialSituation: stability, rampUpExpectation: ramp });
  };

  const showRampSection = stability === 'stable';

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('financial_title')}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
        {t('financial_description')}
      </p>

      <div className="space-y-2 mb-6">
        {stabilityOptions.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              stability === opt.value
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <input
              type="radio"
              name="financial"
              value={opt.value}
              checked={stability === opt.value}
              onChange={() => handleStabilityChange(opt.value)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                stability === opt.value ? 'border-primary' : 'border-muted-foreground/40'
              }`}
            >
              {stability === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className="text-foreground text-sm">{opt.label}</span>
          </label>
        ))}
      </div>

      {showRampSection && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-lg font-bold text-foreground mb-3">{rampTitle}</h3>
          <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
            {rampDescription}
          </p>

          <div className="space-y-2 mb-6">
            {rampOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  ramp === opt.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="ramp"
                  value={opt.value}
                  checked={ramp === opt.value}
                  onChange={() => setRamp(opt.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    ramp === opt.value ? 'border-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {ramp === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-foreground text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!showRampSection || !ramp}
        className="w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

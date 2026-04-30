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
 *  - legacy / null: pregunta de runway financiero (estable / necesita ya).
 *  - trebolife:    pregunta de RAMP-UP. ¿Cuándo esperas llegar a la cuota
 *                  mínima de 5 ventas/día? El que dice "mes 3+" no encaja
 *                  en el modelo de comisión recurrente y descalifica.
 */
export default function FinancialStep({ onNext, onDisqualify, company }: Props) {
  const { t } = useLanguage();
  const [answer, setAnswer] = useState('');

  const isTrebolife = company === 'trebolife';

  const handleSubmit = () => {
    if (isTrebolife) {
      // El scoring + posible descalificación se hacen en Evaluate.tsx
      // (caso 11) usando scoreRampUp(). Aquí solo enviamos la opción.
      onNext({ rampUpExpectation: answer });
      return;
    }
    // Flujo legacy
    if (answer === 'needs_now') {
      onDisqualify('sin_runway');
      return;
    }
    onNext({ financialSituation: answer });
  };

  const options = isTrebolife
    ? [
        { value: 'week_1_2',     label: t('ramp_week_1_2') },
        { value: 'week_3_4',     label: t('ramp_week_3_4') },
        { value: 'month_2',      label: t('ramp_month_2') },
        { value: 'month_3_plus', label: t('ramp_month_3_plus') },
      ]
    : [
        { value: 'stable',     label: t('financial_stable') },
        { value: 'needs_now',  label: t('financial_needs_now') },
      ];

  const title       = isTrebolife ? t('ramp_title')       : t('financial_title');
  const description = isTrebolife ? t('ramp_description') : t('financial_description');

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
        {description}
      </p>

      <div className="space-y-2 mb-6">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              answer === opt.value
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <input
              type="radio"
              name="financial"
              value={opt.value}
              checked={answer === opt.value}
              onChange={() => setAnswer(opt.value)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                answer === opt.value ? 'border-primary' : 'border-muted-foreground/40'
              }`}
            >
              {answer === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className="text-foreground text-sm">{opt.label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!answer}
        className="w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Company } from '@/types/evaluation';

interface Props {
  onNext: (data: Record<string, any>) => void;
  company: Company;
}

/**
 * Trebolife: filters closers who close subscriptions BY PRESSURE (cancel
 *   month 2) vs those who close with FIT (that retain).
 * Traduce: evaluates retention and recurrence — how the closer converts a
 *   one-time transaction client into a recurring client.
 * No disqualification — response is saved for qualitative recruiter review.
 */
export default function ChurnResistanceStep({ onNext, company }: Props) {
  const { t } = useLanguage();
  const [text, setText] = useState('');

  const isTraduce = company === 'traduce';

  const handleSubmit = () => {
    onNext({ churnPrevention: text.trim() });
  };

  const title       = isTraduce ? t('churn_title_traduce')       : t('churn_title');
  const scenario    = isTraduce ? t('churn_scenario_traduce')    : t('churn_scenario');
  const question    = isTraduce ? t('churn_question_traduce')    : t('churn_question');
  const placeholder = isTraduce ? t('churn_placeholder_traduce') : t('churn_placeholder');

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      <div className="my-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-foreground font-medium whitespace-pre-line">{scenario}</p>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-6">{question}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
      />
      {!isTraduce && (
        <p className="text-xs text-muted-foreground/60 mt-2">{t('churn_hint')}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={text.trim().length < 30}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

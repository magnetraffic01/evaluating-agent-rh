import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

export default function IncomeStep({ onNext }: Props) {
  const { t } = useLanguage();
  const [income, setIncome] = useState('');
  const [exitReason, setExitReason] = useState('');

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('income_title')}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">{t('income_description')}</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('income_label')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Ej: 800"
              className="w-full bg-input border border-border rounded-lg pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('income_exit_label')}
          </label>
          <textarea
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
            placeholder={t('income_exit_placeholder')}
            rows={3}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
          />
        </div>
      </div>

      <button
        onClick={() => onNext({ lastIncome: Number(income), exitReason })}
        disabled={!income || !exitReason.trim()}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

export default function PhilosophyStep({ onNext }: Props) {
  const { t } = useLanguage();
  const [choice, setChoice] = useState('');
  const [explanation, setExplanation] = useState('');

  const options = [
    { value: 'A', title: t('philo_a_title'), desc: t('philo_a_desc') },
    { value: 'B', title: t('philo_b_title'), desc: t('philo_b_desc') },
    { value: 'C', title: t('philo_c_title'), desc: t('philo_c_desc') },
  ];

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('philo_title')}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
        {t('philo_description')}
      </p>

      <div className="space-y-3 mb-6">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setChoice(opt.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              choice === opt.value
                ? 'border-primary bg-primary/10 gold-border-glow'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <p className="font-semibold text-foreground text-sm">{opt.title}</p>
            <p className="text-muted-foreground text-xs mt-1">{opt.desc}</p>
          </button>
        ))}
      </div>

      {choice && (
        <div className="animate-fade-in">
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('philo_explain_label')}
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder={t('philo_explain_placeholder')}
            rows={3}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
          />
        </div>
      )}

      <button
        onClick={() => onNext({ philosophy: choice, philosophyExplanation: explanation })}
        disabled={!choice}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

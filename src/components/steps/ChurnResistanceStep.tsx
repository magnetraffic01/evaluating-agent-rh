import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

/**
 * Trebolife-only: filtra al closer que cierra suscripciones POR PRESIÓN
 * (que cancelan al mes 2) vs el que cierra con FIT (que retiene).
 * No descalifica — la respuesta queda guardada para que la reclutadora
 * la lea y mida calidad cualitativa.
 */
export default function ChurnResistanceStep({ onNext }: Props) {
  const { t } = useLanguage();
  const [text, setText] = useState('');

  const handleSubmit = () => {
    onNext({ churnPrevention: text.trim() });
  };

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('churn_title')}</h2>
      <div className="my-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-foreground font-medium whitespace-pre-line">{t('churn_scenario')}</p>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-6">{t('churn_question')}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('churn_placeholder')}
        rows={5}
        className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
      />
      <p className="text-xs text-muted-foreground/60 mt-2">{t('churn_hint')}</p>
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

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

export default function ObjectionStep({ onNext, onDisqualify }: Props) {
  const { t } = useLanguage();
  const [response, setResponse] = useState('');

  const handleSubmit = () => {
    if (response.trim().length < 10) {
      onDisqualify('sin_objeciones');
      return;
    }
    onNext({ objectionResponse: response });
  };

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('objection_title')}</h2>
      <p className="text-muted-foreground leading-relaxed mb-2">{t('objection_setup')}</p>
      <div className="my-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-foreground font-medium">{t('objection_quote')}</p>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-6">{t('objection_description')}</p>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder={t('objection_placeholder')}
        rows={5}
        className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={response.trim().length < 10}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

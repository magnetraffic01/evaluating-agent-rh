import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

export default function ReactivationStep({ onNext, onDisqualify }: Props) {
  const { t } = useLanguage();
  const [msg, setMsg] = useState('');

  const handleSubmit = () => {
    if (msg.trim().length < 10) {
      onDisqualify('sin_copywriting');
      return;
    }
    onNext({ reactivationMsg: msg });
  };

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('react_title')}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
        {t('react_description')}
      </p>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value.slice(0, 500))}
        placeholder={t('react_placeholder')}
        rows={5}
        className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
      />
      <p className="text-xs text-muted-foreground/60 mt-1 text-right">
        {t('react_chars', { count: msg.length })}
      </p>

      <button
        onClick={handleSubmit}
        disabled={msg.trim().length < 10}
        className="mt-4 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

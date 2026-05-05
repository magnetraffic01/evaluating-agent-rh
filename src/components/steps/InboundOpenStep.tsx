import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

/**
 * FASE 10 — Apertura de llamada inbound (solo trebolife + traduce).
 * Evalúa cómo el candidato abre una llamada inbound al recibir un lead que
 * dejó sus datos online. NO descalifica — el scoring será evaluado por LLM
 * en una fase futura. Por ahora solo se guarda la respuesta para revisión
 * cualitativa de la reclutadora.
 *
 * Producto simulado: "Servicio de Bienestar Familiar" ($29/mes — descuentos
 * médicos, dentales y línea 24/7). Es ficticio para evaluar a todos los
 * candidatos por igual sin sesgo de conocimiento previo del producto real.
 */
export default function InboundOpenStep({ onNext }: Props) {
  const { t } = useLanguage();
  const [text, setText] = useState('');

  const minChars = 30;
  const maxChars = 600;
  const trimmedLen = text.trim().length;

  const handleSubmit = () => {
    if (trimmedLen < minChars) return;
    onNext({ inboundOpen: text.trim() });
  };

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('inbound_title')}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
        {t('inbound_description')}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxChars))}
        placeholder={t('inbound_placeholder')}
        rows={6}
        className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
      />
      <p className="text-xs text-muted-foreground/60 mt-1 text-right">
        {t('inbound_chars', { count: text.length })}
      </p>

      <button
        onClick={handleSubmit}
        disabled={trimmedLen < minChars}
        className="mt-4 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

import { useState } from 'react';
import { getHalfDailyCalls } from '@/utils/scoring';

interface Props {
  dailyCalls: number;
  onNext: (data: Record<string, any>) => void;
}

export default function VerificationStep({ dailyCalls, onNext }: Props) {
  const [answer, setAnswer] = useState('');
  const half = getHalfDailyCalls(dailyCalls);

  const options = [
    { value: 'correct', label: `No, eran ${dailyCalls} llamadas` },
    { value: 'incorrect', label: 'Sí, eso fue lo que dije' },
  ];

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Verificación de datos</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Oye, revisando mis notas... creo que me dijiste que hacías unas {half} llamadas al día, ¿verdad?
      </p>

      <div className="space-y-2 mb-6">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              answer === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
            }`}
          >
            <input type="radio" name="verification" value={opt.value} checked={answer === opt.value} onChange={() => setAnswer(opt.value)} className="sr-only" />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${answer === opt.value ? 'border-primary' : 'border-muted-foreground/40'}`}>
              {answer === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className="text-foreground text-sm">{opt.label}</span>
          </label>
        ))}
      </div>

      {answer && (
        <p className="text-sm text-primary mb-4 animate-fade-in">
          Estamos en la recta final. Dos preguntas más y tenemos todo.
        </p>
      )}

      <button
        onClick={() => onNext({ verificationAnswer: answer })}
        disabled={!answer}
        className="w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar →
      </button>
    </div>
  );
}

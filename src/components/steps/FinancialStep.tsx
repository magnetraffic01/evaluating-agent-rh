import { useState } from 'react';

interface Props {
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

export default function FinancialStep({ onNext, onDisqualify }: Props) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer === 'needs_now') {
      onDisqualify('sin_runway');
      return;
    }
    onNext({ financialSituation: answer });
  };

  const options = [
    { value: 'stable', label: 'Tengo estabilidad financiera para los primeros meses' },
    { value: 'needs_now', label: 'Necesito generar ingresos esta semana' },
  ];

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Última pregunta</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Para que el proyecto funcione bien desde el inicio, necesito ser directo contigo:
        <br /><br />
        ¿Tienes una base financiera estable mientras arrancas, o estás en una situación donde necesitas ingresos esta misma semana?
      </p>

      <div className="space-y-2 mb-6">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              answer === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
            }`}
          >
            <input type="radio" name="financial" value={opt.value} checked={answer === opt.value} onChange={() => setAnswer(opt.value)} className="sr-only" />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${answer === opt.value ? 'border-primary' : 'border-muted-foreground/40'}`}>
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
        Continuar →
      </button>
    </div>
  );
}

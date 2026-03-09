import { useState } from 'react';

interface Props {
  name: string;
  onNext: (data: Record<string, any>) => void;
}

const options = [
  { value: '1', label: '1 trabajo o proyecto' },
  { value: '2', label: '2 trabajos o proyectos' },
  { value: '3_plus', label: '3 o más trabajos o proyectos' },
];

export default function StabilityStep({ name, onNext }: Props) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Trayectoria profesional</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        {name}, ¿cuántos empleos o proyectos distintos has tenido en los últimos 3 años?
      </p>

      <div className="space-y-2 mb-6">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              answer === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
            }`}
          >
            <input type="radio" name="stability" value={opt.value} checked={answer === opt.value} onChange={() => setAnswer(opt.value)} className="sr-only" />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${answer === opt.value ? 'border-primary' : 'border-muted-foreground/40'}`}>
              {answer === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className="text-foreground text-sm">{opt.label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={() => onNext({ jobCount: answer })}
        disabled={!answer}
        className="w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar →
      </button>
    </div>
  );
}

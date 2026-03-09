import { useState } from 'react';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

const options = [
  { value: 'A', title: 'Convertir un "no" en "sí"', desc: 'La habilidad de persuadir al cliente que duda' },
  { value: 'B', title: 'Precalificar mejor', desc: 'Llegar más rápido al cliente ideal y no desperdiciar tiempo' },
  { value: 'C', title: 'Depende del contexto', desc: 'Depende del contexto y del tipo de venta' },
];

export default function PhilosophyStep({ onNext }: Props) {
  const [choice, setChoice] = useState('');
  const [explanation, setExplanation] = useState('');

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Criterio comercial</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Una pregunta de criterio:<br /><br />¿Qué es más importante para un closer exitoso?
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
          <label className="block text-sm font-medium text-foreground mb-2">Explica brevemente tu respuesta</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Tu razonamiento..."
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
        Continuar →
      </button>
    </div>
  );
}

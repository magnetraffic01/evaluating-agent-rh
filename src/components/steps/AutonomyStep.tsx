import { useState } from 'react';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

export default function AutonomyStep({ onNext }: Props) {
  const [desc, setDesc] = useState('');

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Tu método de trabajo</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Trabajando 100% en remoto, ¿cómo organizas tu día de ventas y tu pipeline sin un jefe supervisándote?
      </p>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Describe tu rutina y sistema real..."
        rows={4}
        className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
      />
      <button
        onClick={() => onNext({ autonomyDesc: desc })}
        disabled={desc.trim().length < 20}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar →
      </button>
    </div>
  );
}

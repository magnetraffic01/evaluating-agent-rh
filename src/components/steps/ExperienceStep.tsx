import { useState } from 'react';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

export default function ExperienceStep({ onNext }: Props) {
  const [experience, setExperience] = useState('');

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Tu experiencia comercial</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Cuéntame de tu experiencia en ventas: ¿qué vendías, qué herramientas digitales usabas, y ese cierre era por teléfono/video o era presencial?
      </p>
      <textarea
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        placeholder="Describe tu experiencia con el mayor detalle posible..."
        rows={5}
        className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
      />
      <p className="text-xs text-muted-foreground/60 mt-2">Sé específico — esto nos ayuda a entender tu perfil real</p>
      <button
        onClick={() => onNext({ experience })}
        disabled={experience.trim().length < 20}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar →
      </button>
    </div>
  );
}

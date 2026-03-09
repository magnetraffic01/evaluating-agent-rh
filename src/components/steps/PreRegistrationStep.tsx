import { useState } from 'react';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

const maritalOptions = ['Soltero/a', 'Casado/a', 'Unión libre', 'Divorciado/a'];

export default function PreRegistrationStep({ onNext }: Props) {
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [marital, setMarital] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Pre-registro</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Tu evaluación está completa. Para enviarte el siguiente paso, necesito algunos datos adicionales.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Edad</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Ej: 28"
            min={18}
            max={99}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Estado civil</label>
          <div className="space-y-2">
            {maritalOptions.map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  marital === opt ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                }`}
              >
                <input type="radio" name="marital" value={opt} checked={marital === opt} onChange={() => setMarital(opt)} className="sr-only" />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${marital === opt ? 'border-primary' : 'border-muted-foreground/40'}`}>
                  {marital === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-foreground text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onNext({ email, age: Number(age), maritalStatus: marital })}
        disabled={!isValidEmail || !age || !marital}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar →
      </button>
    </div>
  );
}

import { useState } from 'react';

interface Props {
  name: string;
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

export default function BasicInfoStep({ name, onNext, onDisqualify }: Props) {
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');

  const handleSubmit = () => {
    if (!location.trim() || !availability) return;
    if (availability === 'less_30') {
      onDisqualify('sin_disponibilidad');
      return;
    }
    onNext({ location: location.trim(), availability });
  };

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">Información básica</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Perfecto, {name}. Necesito confirmar algunos datos.
        <br /><br />
        ¿Desde qué ciudad y país nos escribes, y estás disponible para trabajar full time (más de 30 horas por semana)?
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Ciudad y país de residencia</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej: Bogotá, Colombia"
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Disponibilidad semanal</label>
          <div className="space-y-2">
            {[
              { value: 'more_30', label: 'Más de 30 horas semanales ✓' },
              { value: 'less_30', label: 'Menos de 30 horas semanales' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  availability === opt.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="availability"
                  value={opt.value}
                  checked={availability === opt.value}
                  onChange={() => setAvailability(opt.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  availability === opt.value ? 'border-primary' : 'border-muted-foreground/40'
                }`}>
                  {availability === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-foreground text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!location.trim() || !availability}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar →
      </button>
    </div>
  );
}

import { useState } from 'react';

interface Props {
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

const roleOptions = [
  { value: 'closer_direct', label: 'Sí, yo cerraba y cobraba directamente' },
  { value: 'closer_support', label: 'Apoyaba el cierre pero no era el responsable final' },
  { value: 'demos_only', label: 'Solo hacía demos o presentaciones' },
  { value: 'no_closing', label: 'No tenía responsabilidad de cierre' },
];

const volumeOptions = [
  { value: '40_plus', label: '40 o más llamadas' },
  { value: '20_39', label: 'Entre 20 y 39 llamadas' },
  { value: '10_19', label: 'Entre 10 y 19 llamadas' },
  { value: 'less_10', label: 'Menos de 10 llamadas' },
];

export default function ClosingRoleStep({ onNext, onDisqualify }: Props) {
  const [role, setRole] = useState('');
  const [volume, setVolume] = useState('');

  const handleSubmit = () => {
    if (!role || !volume) return;
    if (role === 'no_closing') {
      onDisqualify('sin_cierre_directo');
      return;
    }
    onNext({ closingRole: role, closingVolume: volume });
  };

  const RadioGroup = ({ options, value, onChange, name }: { options: typeof roleOptions; value: string; onChange: (v: string) => void; name: string }) => (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            value === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
          }`}
        >
          <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="sr-only" />
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${value === opt.value ? 'border-primary' : 'border-muted-foreground/40'}`}>
            {value === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <span className="text-foreground text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-6">Tu rol en el cierre</h2>

      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground leading-relaxed mb-3">
            En esa experiencia, ¿eras tú quien cerraba la venta final y cobraba, o tu rol era más de apoyo?
          </p>
          <RadioGroup options={roleOptions} value={role} onChange={setRole} name="role" />
        </div>

        <div>
          <p className="text-muted-foreground leading-relaxed mb-3">
            ¿Cuántas llamadas efectivas (con prospecto real) hacías en un día normal de trabajo?
          </p>
          <RadioGroup options={volumeOptions} value={volume} onChange={setVolume} name="volume" />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!role || !volume}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar →
      </button>
    </div>
  );
}

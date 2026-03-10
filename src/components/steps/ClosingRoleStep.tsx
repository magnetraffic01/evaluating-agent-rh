import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
}

interface Option { value: string; label: string }

function RadioGroup({
  options,
  value,
  onChange,
  name,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            value === opt.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              value === opt.value ? 'border-primary' : 'border-muted-foreground/40'
            }`}
          >
            {value === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <span className="text-foreground text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function ClosingRoleStep({ onNext, onDisqualify }: Props) {
  const { t } = useLanguage();
  const [role, setRole] = useState('');
  const [volume, setVolume] = useState('');

  const roleOptions: Option[] = [
    { value: 'closer_direct', label: t('closing_role_1') },
    { value: 'closer_support', label: t('closing_role_2') },
    { value: 'demos_only', label: t('closing_role_3') },
    { value: 'no_closing', label: t('closing_role_4') },
  ];

  const volumeOptions: Option[] = [
    { value: '40_plus', label: t('closing_vol_1') },
    { value: '20_39', label: t('closing_vol_2') },
    { value: '10_19', label: t('closing_vol_3') },
    { value: 'less_10', label: t('closing_vol_4') },
  ];

  const handleSubmit = () => {
    if (!role || !volume) return;
    if (role === 'no_closing') {
      onDisqualify('sin_cierre_directo');
      return;
    }
    onNext({ closingRole: role, closingVolume: volume });
  };

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-6">{t('closing_title')}</h2>

      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('closing_role_q')}</p>
          <RadioGroup options={roleOptions} value={role} onChange={setRole} name="role" />
        </div>

        <div>
          <p className="text-muted-foreground leading-relaxed mb-3">{t('closing_volume_q')}</p>
          <RadioGroup options={volumeOptions} value={volume} onChange={setVolume} name="volume" />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!role || !volume}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

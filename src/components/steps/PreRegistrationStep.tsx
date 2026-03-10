import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onNext: (data: Record<string, any>) => void;
}

export default function PreRegistrationStep({ onNext }: Props) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [marital, setMarital] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Values stored in DB are always the Spanish codes; only labels are translated
  const maritalOptions = [
    { value: 'Soltero/a', label: t('prereg_marital_single') },
    { value: 'Casado/a', label: t('prereg_marital_married') },
    { value: 'Unión libre', label: t('prereg_marital_union') },
    { value: 'Divorciado/a', label: t('prereg_marital_divorced') },
  ];

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('prereg_title')}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">{t('prereg_description')}</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('prereg_email_label')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('prereg_age_label')}
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder={t('prereg_age_placeholder')}
            min={18}
            max={99}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('prereg_marital_label')}
          </label>
          <div className="space-y-2">
            {maritalOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  marital === opt.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="marital"
                  value={opt.value}
                  checked={marital === opt.value}
                  onChange={() => setMarital(opt.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    marital === opt.value ? 'border-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {marital === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-foreground text-sm">{opt.label}</span>
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
        {t('continue')}
      </button>
    </div>
  );
}

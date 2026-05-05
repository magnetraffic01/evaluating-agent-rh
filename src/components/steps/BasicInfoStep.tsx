import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Company } from '@/types/evaluation';

interface Props {
  name: string;
  onNext: (data: Record<string, any>) => void;
  onDisqualify: (reason: string) => void;
  company: Company;
}

export default function BasicInfoStep({ name, onNext, onDisqualify, company }: Props) {
  const { t } = useLanguage();
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const [email, setEmail] = useState('');
  const [languagePref, setLanguagePref] = useState<'es' | 'es_en' | ''>('');

  const isTrebolife = company === 'trebolife';
  const isTraduce = company === 'traduce';
  // Both Trebolife and Traduce require 40h+ and collect email in BasicInfo.
  const isFullTimeCompany = isTrebolife || isTraduce;

  const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // Trebolife/Traduce: 40h+ (heavy follow-up volume for both models).
  const availabilityOptions = isFullTimeCompany
    ? [
        { value: 'more_40', label: t('basic_more40') },
        { value: 'less_40', label: t('basic_less40') },
      ]
    : [
        { value: 'more_30', label: t('basic_more30') },
        { value: 'less_30', label: t('basic_less30') },
      ];

  // Company-specific description with 40h + email mention.
  const description = isTrebolife
    ? t('basic_description_trebolife', { name })
    : isTraduce
      ? t('basic_description_traduce', { name })
      : t('basic_description', { name });

  const disqualifyValue = isFullTimeCompany ? 'less_40' : 'less_30';
  const submitDisabled =
    !location.trim() ||
    !availability ||
    (isFullTimeCompany && !isEmailValid(email)) ||
    (isFullTimeCompany && !languagePref);

  const handleClick = () => {
    if (!location.trim() || !availability) return;
    if (isFullTimeCompany && !isEmailValid(email)) return;
    if (isFullTimeCompany && !languagePref) return;
    if (availability === disqualifyValue) {
      onDisqualify('sin_disponibilidad');
      return;
    }
    const payload: Record<string, any> = {
      location: location.trim(),
      availability,
    };
    if (isFullTimeCompany) {
      payload.email = email.trim();
      payload.languagePref = languagePref;
    }
    onNext(payload);
  };

  const languageOptions: Array<{ value: 'es' | 'es_en'; label: string }> = [
    { value: 'es',    label: t('basic_language_es_only') },
    { value: 'es_en', label: t('basic_language_bilingual') },
  ];

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('basic_title')}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
        {description}
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('basic_location_label')}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('basic_location_placeholder')}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {isFullTimeCompany && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('basic_email_label')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('basic_email_placeholder')}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            {t('basic_availability_label')}
          </label>
          <div className="space-y-2">
            {availabilityOptions.map((opt) => (
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
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    availability === opt.value
                      ? 'border-primary'
                      : 'border-muted-foreground/40'
                  }`}
                >
                  {availability === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-foreground text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {isFullTimeCompany && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              {t('basic_language_label')}
            </label>
            <div className="space-y-2">
              {languageOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    languagePref === opt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="languagePref"
                    value={opt.value}
                    checked={languagePref === opt.value}
                    onChange={() => setLanguagePref(opt.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      languagePref === opt.value
                        ? 'border-primary'
                        : 'border-muted-foreground/40'
                    }`}
                  >
                    {languagePref === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-foreground text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleClick}
        disabled={submitDisabled}
        className="mt-6 w-full gold-gradient text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')}
      </button>
    </div>
  );
}

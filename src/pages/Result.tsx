import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import MagnetLogo from '@/components/MagnetLogo';
import { EvaluationState } from '@/types/evaluation';
import { useLanguage } from '@/contexts/LanguageContext';

const CALENDAR_ELITE = import.meta.env.VITE_CALENDAR_ELITE || 'https://link.magnetraffic.com/widget/bookings/presentacion-closer';
const CALENDAR_STD   = import.meta.env.VITE_CALENDAR_STD   || 'https://link.magnetraffic.com/widget/bookings/presentacion-closer';

// ─── Particle burst para Elite ────────────────────────────────────────────────

function ParticleBurst() {
  const particles = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * 360;
    const rad = (angle * Math.PI) / 180;
    const dist = 55 + Math.random() * 40;
    return {
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist - 30,
      color: i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#F0C040' : '#C0C0C0',
      duration: 0.9 + Math.random() * 0.5,
      delay: Math.random() * 0.3,
    };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-xl">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 0, x: p.tx, y: p.ty }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

// ─── Stagger text reveal ──────────────────────────────────────────────────────

function RevealText({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Result layouts ───────────────────────────────────────────────────────────

function EliteResult({ name }: { name: string }) {
  const { t } = useLanguage();
  return (
    <div className="text-center space-y-6">
      <RevealText delay={0.1}>
        <div className="inline-flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
            className="text-5xl float-anim"
          >
            🔥
          </motion.div>
          <div className="shimmer-btn inline-block px-6 py-2 rounded-full gold-gradient">
            <span className="text-primary-foreground font-bold text-base tracking-widest uppercase">
              {t('result_elite_badge')}
            </span>
          </div>
        </div>
      </RevealText>

      <RevealText delay={0.3} className="text-muted-foreground text-sm">
        {t('result_elite_subtitle')}
      </RevealText>

      <RevealText delay={0.45}>
        <p className="text-foreground text-lg leading-relaxed whitespace-pre-line">
          <strong>{name}</strong>
          {t('result_elite_msg', { name: '' }).replace('{name}', '')}
        </p>
      </RevealText>

      <RevealText delay={0.6}>
        <div className="relative glow-card-gold rounded-xl p-6">
          <ParticleBurst />
          <h3 className="text-foreground font-bold text-lg mb-2">{t('result_elite_next_title')}</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed whitespace-pre-line">
            {t('result_elite_next_desc')}
          </p>
          <a
            href={CALENDAR_ELITE}
            target="_blank"
            rel="noopener noreferrer"
            className="shimmer-btn inline-block gold-gradient text-primary-foreground font-bold py-4 px-8 rounded-full text-base transition-all hover:opacity-90 active:scale-[0.98] animate-pulse-gold"
          >
            {t('result_elite_cta')}
          </a>
        </div>
      </RevealText>
    </div>
  );
}

function CalificadoResult({ name }: { name: string }) {
  const { t } = useLanguage();
  return (
    <div className="text-center space-y-6">
      <RevealText delay={0.1}>
        <div className="inline-flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.15 }}
            className="text-4xl"
          >
            ✅
          </motion.div>
          <div className="inline-block px-6 py-2 rounded-full bg-success/15 border border-success/40">
            <span className="text-success font-bold text-base tracking-widest uppercase">
              {t('result_calificado_badge')}
            </span>
          </div>
        </div>
      </RevealText>

      <RevealText delay={0.35}>
        <p className="text-foreground text-lg leading-relaxed whitespace-pre-line">
          <strong>{name}</strong>
          {t('result_calificado_msg', { name: '' }).replace('{name}', '')}
        </p>
      </RevealText>

      <RevealText delay={0.5}>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-foreground font-bold text-lg mb-2">{t('result_calificado_card_title')}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {t('result_calificado_card_desc')}
          </p>
          <a
            href={CALENDAR_STD}
            target="_blank"
            rel="noopener noreferrer"
            className="shimmer-btn inline-block bg-success text-white font-bold py-4 px-8 rounded-full text-base transition-all hover:opacity-90 active:scale-[0.98]"
          >
            {t('result_calificado_cta')}
          </a>
        </div>
      </RevealText>
    </div>
  );
}

function PotencialResult({ name, phone }: { name: string; phone: string }) {
  const { t } = useLanguage();
  return (
    <div className="text-center space-y-6">
      <RevealText delay={0.1}>
        <div className="inline-flex flex-col items-center gap-3">
          <div className="text-4xl">⏳</div>
          <div className="inline-block px-6 py-2 rounded-full bg-muted border border-border">
            <span className="text-muted-foreground font-bold text-base tracking-widest uppercase">
              {t('result_potencial_badge')}
            </span>
          </div>
        </div>
      </RevealText>

      <RevealText delay={0.3}>
        <p className="text-foreground text-lg font-medium">
          {t('result_potencial_completed', { name })}
        </p>
      </RevealText>

      <RevealText delay={0.45}>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {t('result_potencial_desc', { hours: '48' })}
        </p>
      </RevealText>

      <RevealText delay={0.6}>
        <div className="glass-card rounded-xl p-4 text-sm text-muted-foreground">
          {t('result_potencial_phone')} <span className="text-foreground font-mono">{phone}</span>
        </div>
      </RevealText>
    </div>
  );
}

function DescartadoResult({ name, reason }: { name: string; reason: string }) {
  const { t } = useLanguage();
  const reasonKey = `disq_${reason}` as string;
  const reasonText = t(reasonKey) !== reasonKey ? t(reasonKey) : t('disq_default');

  return (
    <div className="text-center space-y-6">
      <RevealText delay={0.1}>
        <div className="inline-block px-6 py-2 rounded-full bg-muted/50 border border-border">
          <span className="text-muted-foreground font-medium text-base">
            {t('result_descartado_badge')}
          </span>
        </div>
      </RevealText>

      <RevealText delay={0.3}>
        <p className="text-foreground text-lg font-medium">
          {t('result_descartado_msg', { name })}
        </p>
      </RevealText>

      <RevealText delay={0.45}>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {t('result_descartado_desc', { reason: reasonText })}
        </p>
      </RevealText>
    </div>
  );
}

// ─── Página Result ────────────────────────────────────────────────────────────

export default function Result() {
  const { t } = useLanguage();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [state, setState] = useState<EvaluationState | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const saved = localStorage.getItem(`eval_${sessionId}`);
    if (saved) setState(JSON.parse(saved));
  }, [sessionId]);

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 text-center">
          <MagnetLogo />
          <p className="text-muted-foreground mt-4">{t('session_not_found')}</p>
        </div>
      </div>
    );
  }

  const renderResult = () => {
    switch (state.status) {
      case 'elite':
        return <EliteResult name={state.name} />;
      case 'calificado':
        return <CalificadoResult name={state.name} />;
      case 'potencial':
        return <PotencialResult name={state.name} phone={state.phone} />;
      default:
        return <DescartadoResult name={state.name} reason={state.disqualifyReason || ''} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Radial glow de fondo según resultado */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-3xl opacity-20 ${
            state.status === 'elite'      ? 'bg-primary' :
            state.status === 'calificado' ? 'bg-success'  :
            'bg-muted'
          }`}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="max-w-lg w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-10"
          >
            <MagnetLogo />
          </motion.div>
          {renderResult()}
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground/40 relative z-10">
        {state.status === 'descartado' ? t('footer_thanks') : t('footer_confidential')}
      </footer>
    </div>
  );
}

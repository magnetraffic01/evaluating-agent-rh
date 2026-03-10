import { motion } from 'framer-motion';
import MagnetLogo from '@/components/MagnetLogo';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Expired() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-8 max-w-md text-center"
      >
        <div className="flex justify-center mb-6">
          <MagnetLogo />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">{t('expired_title')}</h1>
        <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
          {t('expired_desc')}
        </p>
        <div className="w-12 h-0.5 gold-gradient mx-auto" />
      </motion.div>
      <footer className="mt-8 text-xs text-muted-foreground/50">
        {t('footer_confidential')}
      </footer>
    </div>
  );
}

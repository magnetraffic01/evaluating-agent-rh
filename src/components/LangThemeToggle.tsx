import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LangThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed bottom-5 right-4 z-50 flex items-center gap-1 glass-card rounded-full px-2 py-1.5 shadow-lg">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="p-1.5 rounded-full hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground"
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Divider */}
      <div className="w-px h-3.5 bg-border mx-0.5" />

      {/* Language buttons */}
      <button
        onClick={() => setLang('es')}
        className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
          lang === 'es'
            ? 'gold-gradient text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
          lang === 'en'
            ? 'gold-gradient text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
    </div>
  );
}
